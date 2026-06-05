"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = treeRoutes;
const tree_auth_1 = require("../../middleware/tree-auth");
const trees_1 = require("../../shared/schemas/trees");
const trees_service_1 = require("./trees.service");
const audit_service_1 = require("../../modules/audit/audit.service");
const zod_1 = require("zod");
const treeIdParamSchema = zod_1.z.object({
    treeId: zod_1.z.string().uuid()
});
async function treeRoutes(fastify) {
    /**
     * Create a new family tree
     */
    fastify.post('/trees', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { name } = trees_1.createTreeSchema.parse(request.body);
        const user = request.user;
        const tree = await trees_service_1.TreesService.createTree(name, user.id, user.email, user.email?.split('@')[0] || 'Admin');
        return {
            success: true,
            data: tree
        };
    });
    /**
     * Get all trees the user is a member of (including pending requests)
     */
    fastify.get('/trees', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const trees = await trees_service_1.TreesService.getUserTrees(user.id);
        return { success: true, data: trees };
    });
    /**
     * Get specific tree details
     */
    fastify.get('/trees/:treeId', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member', 'viewer'])]
    }, async (request, reply) => {
        const { treeId } = treeIdParamSchema.parse(request.params);
        const tree = await trees_service_1.TreesService.getTreeDetails(treeId);
        return {
            success: true,
            data: {
                ...tree,
                role: request.treeRole
            }
        };
    });
    /**
     * Visual Tree Data
     */
    fastify.get('/trees/:treeId/visual', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member', 'viewer'])]
    }, async (request, reply) => {
        const { treeId } = treeIdParamSchema.parse(request.params);
        const people = await trees_service_1.TreesService.getVisualData(treeId);
        return { success: true, data: people };
    });
    /**
     * Get all members (users) of a tree
     */
    fastify.get('/trees/:treeId/members', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member', 'viewer'])]
    }, async (request, reply) => {
        const { treeId } = treeIdParamSchema.parse(request.params);
        const members = await trees_service_1.TreesService.getMembers(treeId);
        return { success: true, data: members };
    });
    /**
     * Get tree activity logs
     */
    fastify.get('/trees/:treeId/activity', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member', 'viewer'])]
    }, async (request, reply) => {
        const { treeId } = treeIdParamSchema.parse(request.params);
        const { limit } = zod_1.z.object({ limit: zod_1.z.string().optional() }).parse(request.query);
        const logs = await audit_service_1.AuditService.getTreeLogs(treeId, limit ? parseInt(limit, 10) : 50);
        return { success: true, data: logs };
    });
}
