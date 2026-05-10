import { FastifyInstance } from 'fastify';
import { getSession } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from './notifications';

const VALID = new Set(['PARENT_OF', 'MARRIED_TO', 'SIBLING_OF']);

export default async function relationshipsRoutes(fastify: FastifyInstance) {
  fastify.post('/relationship', async (request, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });

    const b = request.body as any;
    const fromId = b.fromId;
    const toId = b.toId;
    const type = b.type;

    if (!fromId || !toId || !type) return reply.status(400).send({ error: 'Missing fields' });
    if (!VALID.has(type)) return reply.status(400).send({ error: 'Invalid relationship type' });
    if (fromId === toId) return reply.status(400).send({ error: 'Cannot relate to self' });

    const session = getSession();
    try {
      // Get creators of both persons
      const personRes = await session.run(
        `MATCH (a:Person {id:$from}), (b:Person {id:$to}) RETURN a.createdBy as creatorFrom, b.createdBy as creatorTo`,
        { from: fromId, to: toId }
      );

      if (personRes.records.length === 0) {
        return reply.status(404).send({ error: 'One or both persons not found' });
      }

      const creatorFrom = personRes.records[0].get('creatorFrom');
      const creatorTo = personRes.records[0].get('creatorTo');

      // Check for existing relationship
      const dupRes = await session.run(
        `MATCH (a:Person {id:$from}), (b:Person {id:$to})
         OPTIONAL MATCH (a)-[r:${type}]->(b)
         RETURN count(r) AS existing`,
        { from: fromId, to: toId }
      );
      const existing = dupRes.records[0].get('existing').toNumber ? dupRes.records[0].get('existing').toNumber() : dupRes.records[0].get('existing');
      if (existing > 0) return reply.status(400).send({ error: 'Duplicate relationship' });

      // Option 3: Check if same creator or admin
      const isSameCreator = creatorFrom === creatorTo;
      const isAdmin = user.role === 'admin';
      const isCreator = user.id === creatorFrom || user.id === creatorTo;

      if (!isCreator && !isAdmin) {
        return reply.status(403).send({ error: 'You must be a creator of at least one person' });
      }

      if (isSameCreator || isAdmin) {
        // Create relationship immediately (approved)
        await session.run(
          `MATCH (a:Person {id:$from}), (b:Person {id:$to}) 
           CREATE (a)-[r:${type} {status: 'approved', createdAt: timestamp(), createdBy: $userId}]->(b) 
           RETURN r`,
          { from: fromId, to: toId, userId: user.id }
        );
        return { success: true, status: 'approved', message: 'Relationship created' };
      } else {
        // Different creators - create pending relationship request
        const requestId = uuidv4();
        await session.run(
          `CREATE (pr:PendingRelationship {
            id: $id,
            fromPersonId: $fromId,
            toPersonId: $toId,
            type: $type,
            status: 'pending',
            requestedBy: $userId,
            creatorFrom: $creatorFrom,
            creatorTo: $creatorTo,
            createdAt: timestamp()
          })`,
          { id: requestId, fromId, toId, type, userId: user.id, creatorFrom, creatorTo }
        );

        // Get all admins to notify
        const adminsRes = await session.run(
          `MATCH (u:User {role: 'admin'}) RETURN u.id as adminId`
        );

        const admins = adminsRes.records.map(r => r.get('adminId'));

        // Notify all admins
        for (const adminId of admins) {
          await createNotification(
            adminId,
            'relationship_pending',
            'New Relationship Request',
            `A new relationship request requires your approval between two family members.`,
            { requestId, fromPersonId: fromId, toPersonId: toId, type, requestedBy: user.id }
          );
        }

        // Also notify the other creators involved
        const otherCreators = new Set<string>();
        if (creatorFrom !== user.id) otherCreators.add(creatorFrom);
        if (creatorTo !== user.id) otherCreators.add(creatorTo);

        for (const creatorId of otherCreators) {
          await createNotification(
            creatorId,
            'relationship_pending',
            'Relationship Request Involving Your Family Member',
            `A relationship involving your family member is pending admin approval.`,
            { requestId, fromPersonId: fromId, toPersonId: toId, type, requestedBy: user.id }
          );
        }

        return { 
          success: true, 
          status: 'pending', 
          requestId,
          message: 'Relationship requires admin approval (different creators)' 
        };
      }
    } finally {
      await session.close();
    }
  });
}
