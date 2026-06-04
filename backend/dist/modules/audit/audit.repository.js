"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRepository = void 0;
const database_1 = require("../../core/database");
const uuid_1 = require("uuid");
class AuditRepository {
    static async log(treeId, actorId, actionType, entityType, entityId, metadata = {}) {
        const session = (0, database_1.getSession)();
        try {
            const id = (0, uuid_1.v4)();
            await session.run(`CREATE (a:ActivityLog {
          id: $id,
          treeId: $treeId,
          actorId: $actorId,
          actionType: $actionType,
          entityType: $entityType,
          entityId: $entityId,
          createdAt: timestamp(),
          metadata: $metadata
        })`, {
                id,
                treeId,
                actorId,
                actionType,
                entityType,
                entityId,
                metadata: JSON.stringify(metadata)
            });
        }
        finally {
            await session.close();
        }
    }
    static async findByTreeId(treeId, limit = 50) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (a:ActivityLog {treeId: $treeId})
         MATCH (u:User {id: a.actorId})
         RETURN a, u.name as actorName, u.email as actorEmail
         ORDER BY a.createdAt DESC
         LIMIT toInteger($limit)`, { treeId, limit });
            return result.records.map(r => ({
                ...r.get('a').properties,
                actorName: r.get('actorName'),
                actorEmail: r.get('actorEmail')
            }));
        }
        finally {
            await session.close();
        }
    }
}
exports.AuditRepository = AuditRepository;
