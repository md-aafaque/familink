import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../core/database';
import { AppError } from '../core/errors';
import { verifyTreeAccess } from '../middleware/tree-auth';

export default async function treeRoutes(fastify: FastifyInstance) {
  
  /**
   * Create a new family tree
   */
  fastify.post('/trees', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name } = request.body as { name: string };
    const user = request.user!;

    if (!name) throw new AppError('Tree name is required', 400);

    const treeId = uuidv4();
    const personId = uuidv4(); // Create a person node for the admin
    const session = getSession();

    try {
      await session.run(
        `
        CREATE (t:FamilyTree {
          id: $treeId,
          name: $name,
          createdBy: $userId,
          createdAt: timestamp()
        })
        WITH t
        MATCH (u:User {id: $userId})
        CREATE (u)-[:MEMBER_OF {role: 'admin', joinedAt: timestamp()}]->(t)
        CREATE (p:Person {
          id: $personId,
          treeId: $treeId,
          firstName: $userName,
          status: 'active',
          createdBy: $userId,
          createdAt: timestamp()
        })
        CREATE (p)-[:BELONGS_TO_TREE]->(t)
        CREATE (u)-[:REPRESENTS]->(p)
        RETURN t
        `,
        { 
          treeId, 
          name, 
          userId: user.id, 
          personId,
          userName: user.email?.split('@')[0] || 'Admin' // Fallback for name
        }
      );

      return { 
        success: true, 
        data: { id: treeId, name } 
      };
    } finally {
      await session.close();
    }
  });

  /**
   * Get all trees the user is a member of
   */
  fastify.get('/trees', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[m:MEMBER_OF]->(t:FamilyTree)
         RETURN t, m.role as role
         ORDER BY t.createdAt DESC`,
        { userId: user.id }
      );

      const trees = result.records.map(r => ({
        ...r.get('t').properties,
        role: r.get('role')
      }));

      return { success: true, data: trees };
    } finally {
      await session.close();
    }
  });

  /**
   * Get specific tree details
   */
  fastify.get('/trees/:treeId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { treeId } = request.params as { treeId: string };
    const user = request.user!;
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[m:MEMBER_OF]->(t:FamilyTree {id: $treeId})
         RETURN t, m.role as role`,
        { userId: user.id, treeId }
      );

      if (result.records.length === 0) {
        throw new AppError('Tree not found or access denied', 404);
      }

      return { 
        success: true, 
        data: {
          ...result.records[0].get('t').properties,
          role: result.records[0].get('role')
        }
      };
    } finally {
      await session.close();
    }
  });

  /**
   * Visual Tree Data (Existing but updated)
   */
  fastify.get('/trees/:treeId/visual', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { treeId } = request.params as { treeId: string };
    const user = request.user!;
    const session = getSession();

    try {
      // First verify access
      const access = await session.run(
        `MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(t:FamilyTree {id: $treeId}) RETURN r`,
        { userId: user.id, treeId }
      );
      if (access.records.length === 0) throw new AppError('Access denied', 403);

      const res = await session.run(
        `MATCH (p:Person {treeId: $treeId})
         OPTIONAL MATCH (p)-[r:FAMILY_RELATIONSHIP]->(n:Person)
         RETURN p, collect({rel: r, target: n}) as relationships`,
        { treeId }
      );

      const people = res.records.map(r => ({
        ...r.get('p').properties,
        relationships: r.get('relationships').filter((rel: any) => rel.target !== null).map((rel: any) => ({
          type: rel.rel.properties.type,
          targetId: rel.target.properties.id
        }))
      }));

      return { success: true, data: people };
    } finally {
      await session.close();
    }
  });

  /**
   * Get all members (users) of a tree
   */
  fastify.get('/trees/:treeId/members', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId } = request.params as { treeId: string };
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (u:User)-[r:MEMBER_OF]->(t:FamilyTree {id: $treeId})
         RETURN u, r.role as role, r.joinedAt as joinedAt
         ORDER BY u.name ASC`,
        { treeId }
      );

      const members = result.records.map(r => ({
        ...r.get('u').properties,
        role: r.get('role'),
        joinedAt: r.get('joinedAt')
      }));

      return { success: true, data: members };
    } finally {
      await session.close();
    }
  });
}
