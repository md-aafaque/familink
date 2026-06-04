"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = notificationsRoutes;
const database_1 = require("../../core/database");
const errors_1 = require("../../core/errors");
async function notificationsRoutes(fastify) {
    // Get all notifications for current user
    fastify.get('/notifications', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (n:Notification {userId: $userId})
         RETURN n ORDER BY n.createdAt DESC`, { userId: user.id });
            const notifications = result.records.map(r => {
                const props = r.get('n').properties;
                const normalizeNumber = (value) => typeof value === 'object' && value !== null && typeof value.toNumber === 'function'
                    ? value.toNumber()
                    : value;
                return {
                    ...props,
                    createdAt: normalizeNumber(props.createdAt),
                    readAt: normalizeNumber(props.readAt),
                };
            });
            return { success: true, data: notifications };
        }
        finally {
            await session.close();
        }
    });
    // Get unread count
    fastify.get('/notifications/unread-count', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (n:Notification {userId: $userId, read: false})
         RETURN count(n) as unreadCount`, { userId: user.id });
            const count = result.records[0].get('unreadCount');
            return {
                success: true,
                data: {
                    unreadCount: typeof count === 'object' ? count.toNumber() : count
                }
            };
        }
        finally {
            await session.close();
        }
    });
    // Mark notification as read
    fastify.post('/notifications/:id/read', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const session = (0, database_1.getSession)();
        try {
            const res = await session.run(`MATCH (n:Notification {id: $id, userId: $userId})
         SET n.read = true, n.readAt = timestamp()
         RETURN n`, { id, userId: user.id });
            if (res.records.length === 0) {
                throw new errors_1.AppError('Notification not found', 404);
            }
            return { success: true };
        }
        finally {
            await session.close();
        }
    });
    // Mark all as read
    fastify.post('/notifications/read-all', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const session = (0, database_1.getSession)();
        try {
            await session.run(`MATCH (n:Notification {userId: $userId, read: false})
         SET n.read = true, n.readAt = timestamp()`, { userId: user.id });
            return { success: true };
        }
        finally {
            await session.close();
        }
    });
}
