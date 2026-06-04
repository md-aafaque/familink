"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_service_1 = require("./audit.service");
const tree_auth_1 = require("../../middleware/tree-auth");
const adminRoutes = async (fastify) => {
    /**
     * Get audit logs for a tree
     * Access: Admin
     */
    fastify.get('/trees/:treeId/audit-logs', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const { treeId } = request.params;
        const { limit } = request.query;
        const logs = await audit_service_1.AuditService.getTreeLogs(treeId, limit ? parseInt(limit) : 50);
        return { success: true, data: logs };
    });
};
exports.default = adminRoutes;
