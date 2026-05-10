import { FastifyInstance } from 'fastify';
import { getSession } from '../db';
import { v4 as uuidv4 } from 'uuid';

export default async function notificationsRoutes(fastify: FastifyInstance) {
  // Get all notifications for current user
  fastify.get('/notifications', async (request: any, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });

    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (n:Notification {userId: $userId})
         RETURN n ORDER BY n.createdAt DESC`,
        { userId: user.id }
      );

      const notifications = result.records.map(r => r.get('n').properties);
      return reply.send(notifications);
    } finally {
      await session.close();
    }
  });

  // Get unread count
  fastify.get('/notifications/unread-count', async (request: any, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });

    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (n:Notification {userId: $userId, isRead: false})
         RETURN count(n) as unreadCount`,
        { userId: user.id }
      );

      const unreadCount = result.records[0].get('unreadCount').toNumber
        ? result.records[0].get('unreadCount').toNumber()
        : result.records[0].get('unreadCount');

      return reply.send({ unreadCount });
    } finally {
      await session.close();
    }
  });

  // Mark notification as read
  fastify.post('/notifications/:id/read', async (request: any, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });

    const { id } = request.params;

    const session = getSession();
    try {
      const check = await session.run(
        `MATCH (n:Notification {id: $id, userId: $userId}) RETURN n`,
        { id, userId: user.id }
      );

      if (!check.records.length) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      await session.run(
        `MATCH (n:Notification {id: $id})
         SET n.isRead = true, n.readAt = timestamp()`,
        { id }
      );

      return reply.send({ message: 'Marked as read' });
    } finally {
      await session.close();
    }
  });

  // Mark all notifications as read
  fastify.post('/notifications/read-all', async (request: any, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });

    const session = getSession();
    try {
      await session.run(
        `MATCH (n:Notification {userId: $userId, isRead: false})
         SET n.isRead = true, n.readAt = timestamp()`,
        { userId: user.id }
      );

      return reply.send({ message: 'All notifications marked as read' });
    } finally {
      await session.close();
    }
  });

  // Delete notification
  fastify.delete('/notifications/:id', async (request: any, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });

    const { id } = request.params;

    const session = getSession();
    try {
      const check = await session.run(
        `MATCH (n:Notification {id: $id, userId: $userId}) RETURN n`,
        { id, userId: user.id }
      );

      if (!check.records.length) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      await session.run(
        `MATCH (n:Notification {id: $id}) DELETE n`,
        { id }
      );

      return reply.send({ message: 'Notification deleted' });
    } finally {
      await session.close();
    }
  });

  // Delete all notifications
  fastify.delete('/notifications', async (request: any, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });

    const session = getSession();
    try {
      await session.run(
        `MATCH (n:Notification {userId: $userId}) DELETE n`,
        { userId: user.id }
      );

      return reply.send({ message: 'All notifications deleted' });
    } finally {
      await session.close();
    }
  });
}

// Helper function to create notifications
export async function createNotification(
  userId: string,
  type: 'relationship_approved' | 'relationship_rejected' | 'relationship_pending',
  title: string,
  message: string,
  data: any
) {
  const session = getSession();
  try {
    const notificationId = uuidv4();
    await session.run(
      `CREATE (n:Notification {
        id: $id,
        userId: $userId,
        type: $type,
        title: $title,
        message: $message,
        isRead: false,
        createdAt: timestamp(),
        data: $data
      })`,
      { id: notificationId, userId, type, title, message, data: JSON.stringify(data) }
    );
    return notificationId;
  } finally {
    await session.close();
  }
}
