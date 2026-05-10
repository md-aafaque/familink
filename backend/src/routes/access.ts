import { FastifyInstance } from 'fastify';
import { getSession } from '../db';

export default async function accessRoutes(fastify: FastifyInstance) {
  fastify.post('/people/:id/grant', async (request, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });
    if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin only' });

    const { id } = request.params as any;
    const body = request.body as any;
    const targetUserId = body.userId;
    if (!targetUserId) return reply.status(400).send({ error: 'Missing userId' });

    const session = getSession();
    try {
      await session.run(
        `MERGE (u:User {id:$userId})
         WITH u
         MATCH (p:Person {id:$personId})
         MERGE (u)-[:CAN_EDIT]->(p)`,
        { userId: targetUserId, personId: id }
      );
      return { success: true };
    } finally {
      await session.close();
    }
  });
}
