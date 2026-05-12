import { getSession } from '../../core/database';
import { v4 as uuidv4 } from 'uuid';

export class NotificationsService {
  static async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data: any = {}
  ) {
    const session = getSession();
    try {
      const id = uuidv4();
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
        { id, userId, type, title, message, data: JSON.stringify(data) }
      );
      return id;
    } finally {
      await session.close();
    }
  }
}
