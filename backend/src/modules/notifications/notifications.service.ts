import { NotificationsRepository } from './notifications.repository';
import { normalizeNeo4jProperties } from '../../core/database-utils';

export class NotificationsService {
  static async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata: any = {}
  ) {
    return NotificationsRepository.create(userId, type, title, message, metadata);
  }

  static async getUserNotifications(userId: string) {
    const notifications = await NotificationsRepository.findByUserId(userId);
    return notifications.map((n: any) => ({
      ...normalizeNeo4jProperties(n.properties || n),
      data: n.metadata || n.data,
    }));
  }

  static async getUnreadCount(userId: string) {
    return NotificationsRepository.getUnreadCount(userId);
  }

  static async markAsRead(notificationId: string, userId: string) {
    return NotificationsRepository.markAsRead(notificationId, userId);
  }

  static async markAllAsRead(userId: string) {
    return NotificationsRepository.markAllAsRead(userId);
  }

  static async delete(notificationId: string, userId: string) {
    return NotificationsRepository.delete(notificationId, userId);
  }

  static async deleteAll(userId: string) {
    return NotificationsRepository.deleteAll(userId);
  }
}
