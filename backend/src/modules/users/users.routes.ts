import { FastifyInstance } from 'fastify';
import { AppError } from '../../core/errors';
import { UsersRepository } from './users.repository';
import { getUserSignedUploadUrl } from '../../core/supabase';
import { z } from 'zod';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.get('/auth/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    const profile = await UsersRepository.findById(user.id);
    if (!profile) {
      throw new AppError('User not found', 404);
    }

    return reply.status(200).send({
      success: true,
      data: profile
    });
  });

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

  fastify.patch('/auth/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    const updates = request.body as any;
    const allowedFields = ['name', 'bio', 'avatarUrl', 'phone', 'language', 'timezone', 'notificationPreferences'];
    const filteredUpdates: any = {};

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    try {
      const result = await UsersRepository.updateProfile(user.id, filteredUpdates);

      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (err) {
      request.log.error({ err, userId: user.id }, 'Profile Update Error');
      throw new AppError('Failed to update profile', 500);
    }
  });

  fastify.post('/auth/avatar/upload-url', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    const { fileName } = z.object({ fileName: z.string() }).parse(request.body);
    const data = await getUserSignedUploadUrl(user.id, fileName);

    return reply.status(200).send({
      success: true,
      data
    });
  });

  fastify.delete('/auth/account', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    try {
      await UsersRepository.deleteUser(user.id);
      request.log.info({ userId: user.id }, 'User account terminated');

      return reply.status(200).send({
        success: true,
        message: 'Account successfully terminated'
      });
    } catch (err) {
      request.log.error({ err, userId: user.id }, 'Account Deletion Error');
      throw new AppError('Failed to terminate account', 500);
    }
  });
}
