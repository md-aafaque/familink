import { FastifyInstance } from 'fastify';
import { AppError } from '../../core/errors';
import { UsersRepository } from './users.repository';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/sync', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    try {
      const result = await UsersRepository.syncUser(user.id, user.email, user.name || '');

      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (err) {
      request.log.error({ err }, 'Sync Error');
      throw new AppError('Database sync failed', 500);
    }
  });
}
