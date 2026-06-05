"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const errors_1 = require("../../core/errors");
const users_repository_1 = require("./users.repository");
async function authRoutes(fastify) {
    fastify.post('/auth/sync', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        if (!user) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        try {
            const result = await users_repository_1.UsersRepository.syncUser(user.id, user.email, user.name || '');
            return reply.status(200).send({
                success: true,
                data: result
            });
        }
        catch (err) {
            request.log.error({ err }, 'Sync Error');
            throw new errors_1.AppError('Database sync failed', 500);
        }
    });
}
