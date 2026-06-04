"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsRepository = void 0;
const database_1 = require("../../core/database");
const uuid_1 = require("uuid");
class NotificationsRepository {
    static async create(userId, type, title, message, metadata = {}) {
        const session = (0, database_1.getSession)();
        try {
            const id = (0, uuid_1.v4)();
            await session.run(`
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
        `, { id, userId, type, title, message, metadata: JSON.stringify(metadata) });
            return id;
        }
        finally {
            await session.close();
        }
    }
    static async findByUserId(userId, limit = 50) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (u:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification)
         RETURN n
         ORDER BY n.createdAt DESC
         LIMIT toInteger($limit)`, { userId, limit });
            return result.records.map(r => r.get('n').properties);
        }
        finally {
            await session.close();
        }
    }
    static async markAsRead(notificationId, userId) {
        const session = (0, database_1.getSession)();
        try {
            await session.run(`MATCH (u:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification {id: $notificationId})
         SET n.isRead = true`, { userId, notificationId });
        }
        finally {
            await session.close();
        }
    }
}
exports.NotificationsRepository = NotificationsRepository;
