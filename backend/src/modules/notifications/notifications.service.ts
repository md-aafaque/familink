import { NotificationsRepository } from './notifications.repository';

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
    return NotificationsRepository.findByUserId(userId);
  }

  static async markAsRead(notificationId: string, userId: string) {
    return NotificationsRepository.markAsRead(notificationId, userId);
  }
}
