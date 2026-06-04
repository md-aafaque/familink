"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const audit_repository_1 = require("./audit.repository");
class AuditService {
    static async log(treeId, actorId, actionType, entityType, entityId, metadata = {}) {
        await audit_repository_1.AuditRepository.log(treeId, actorId, actionType, entityType, entityId, metadata);
    }
    static async getTreeLogs(treeId, limit = 50) {
        return audit_repository_1.AuditRepository.findByTreeId(treeId, limit);
    }
}
exports.AuditService = AuditService;
