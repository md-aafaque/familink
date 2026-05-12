import { FastifyInstance } from 'fastify';
import { getSession } from '../core/database';
import { AppError } from '../core/errors';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/sync', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    const session = getSession();
    try {
      const result = await session.executeWrite(async (tx) => {
        const query = `
          MERGE (u:User {id: $id})
          SET u.email = $email, 
              u.lastSynced = timestamp(),
              u.createdAt = COALESCE(u.createdAt, timestamp())
          RETURN u
        `;
        const res = await tx.run(query, { id: user.id, email: user.email });
        return res.records[0].get('u').properties;
      });

      return reply.status(200).send({ 
        success: true, 
        data: result 
      });
    } catch (err) {
      request.log.error({ err }, 'Sync Error');
      throw new AppError('Database sync failed', 500);
    } finally {
      await session.close();
    }
  });
}
