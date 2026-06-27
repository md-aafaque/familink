import { FastifyInstance } from 'fastify';
import { NotificationsService } from './notifications.service';
import { AppError } from '../../core/errors';
import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().uuid()
});

export default async function notificationsRoutes(fastify: FastifyInstance) {
  fastify.get('/notifications', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const notifications = await NotificationsService.getUserNotifications(user.id);
    return { success: true, data: notifications };
  });

  fastify.get('/notifications/unread-count', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const unreadCount = await NotificationsService.getUnreadCount(user.id);
    return { success: true, data: { unreadCount } };
  });

  fastify.post('/notifications/:id/read', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = idParamSchema.parse(request.params);
    await NotificationsService.markAsRead(id, user.id);
    return { success: true };
  });

  fastify.post('/notifications/read-all', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    await NotificationsService.markAllAsRead(user.id);
    return { success: true };
  });

  fastify.delete('/notifications/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = idParamSchema.parse(request.params);
    await NotificationsService.delete(id, user.id);
    return { success: true };
  });

  fastify.delete('/notifications', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const deletedCount = await NotificationsService.deleteAll(user.id);
    return { success: true, deletedCount };
  });
}
