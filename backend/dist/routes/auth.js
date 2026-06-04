"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const database_1 = require("../core/database");
const errors_1 = require("../core/errors");
async function authRoutes(fastify) {
    fastify.post('/auth/sync', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        if (!user) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const session = (0, database_1.getSession)();
        try {
            const result = await session.executeWrite(async (tx) => {
                const query = `
          MERGE (u:User {id: $id})
          SET u.email = $email, 
              u.lastSynced = timestamp(),
              u.createdAt = COALESCE(u.createdAt, timestamp())
          RETURN u
        `;
                const res = await tx.run(query, { id: user.id, email: user.email });
                return res.records[0].get('u').properties;
            });
            return reply.status(200).send({
                success: true,
                data: result
            });
        }
        catch (err) {
            request.log.error({ err }, 'Sync Error');
            throw new errors_1.AppError('Database sync failed', 500);
        }
        finally {
            await session.close();
        }
    });
}
