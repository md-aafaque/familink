"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const database_1 = require("../../core/database");
class UsersRepository {
    static async findById(id) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (u:User {id: $id}) RETURN u`, { id });
            if (result.records.length === 0)
                return null;
            return result.records[0].get('u').properties;
        }
        finally {
            await session.close();
        }
    }
    static async getEmail(id) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (u:User {id: $id}) RETURN u.email as email`, { id });
            if (result.records.length === 0)
                return null;
            return result.records[0].get('email');
        }
        finally {
            await session.close();
        }
    }
    static async syncUser(id, email, name) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.executeWrite(async (tx) => {
                const query = `
          MERGE (u:User {id: $id})
          SET u.email = $email,
              u.name = $name,
              u.lastSynced = timestamp(),
              u.createdAt = COALESCE(u.createdAt, timestamp())
          RETURN u
        `;
                const res = await tx.run(query, { id, email, name });
                return res.records[0].get('u').properties;
            });
            return result;
        }
        finally {
            await session.close();
        }
    }
}
exports.UsersRepository = UsersRepository;
