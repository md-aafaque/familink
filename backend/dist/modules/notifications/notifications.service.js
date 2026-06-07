"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const notifications_repository_1 = require("./notifications.repository");
class NotificationsService {
    static async createNotification(userId, type, title, message, metadata = {}) {
        return notifications_repository_1.NotificationsRepository.create(userId, type, title, message, metadata);
    }
    static async getUserNotifications(userId) {
        return notifications_repository_1.NotificationsRepository.findByUserId(userId);
    }
    static async markAsRead(notificationId, userId) {
        return notifications_repository_1.NotificationsRepository.markAsRead(notificationId, userId);
    }
}
exports.NotificationsService = NotificationsService;
