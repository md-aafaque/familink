import { getSession } from '../../core/database';
import { v4 as uuidv4 } from 'uuid';

export class NotificationsRepository {
  static async create(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata: any = {}
  ) {
    const session = getSession();
    try {
      const id = uuidv4();
      await session.run(
        `
        MATCH (u:User {id: $userId})
        CREATE (n:Notification {
          id: $id,
          userId: $userId,
          type: $type,
          title: $title,
          message: $message,
          metadata: $metadata,
          isRead: false,
          createdAt: timestamp()
        })
        CREATE (u)-[:HAS_NOTIFICATION]->(n)
        `,
        { id, userId, type, title, message, metadata: JSON.stringify(metadata) }
      );
      return id;
    } finally {
      await session.close();
    }
  }

  static async findByUserId(userId: string, limit: number = 50) {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification)
         RETURN n
         ORDER BY n.createdAt DESC
         LIMIT toInteger($limit)`,
        { userId, limit }
      );
      return result.records.map(r => r.get('n').properties);
    } finally {
      await session.close();
    }
  }

  static async delete(notificationId: string, userId: string) {
    const session = getSession();
    try {
      await session.run(
        `MATCH (u:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification {id: $notificationId})
         DETACH DELETE n`,
        { userId, notificationId }
      );
    } finally {
      await session.close();
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    const session = getSession();
    try {
      await session.run(
        `MATCH (u:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification {id: $notificationId})
         SET n.isRead = true`,
        { userId, notificationId }
      );
    } finally {
      await session.close();
    }
  }
}
