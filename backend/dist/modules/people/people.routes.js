"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = peopleRoutes;
const people_1 = require("@shared/schemas/people");
const people_service_1 = require("./people.service");
const people_repository_1 = require("./people.repository");
const tree_auth_1 = require("../../middleware/tree-auth");
const errors_1 = require("../../core/errors");
const zod_1 = require("zod");
const treeIdParamSchema = zod_1.z.object({
    treeId: zod_1.z.string().uuid()
});
const personIdParamSchema = treeIdParamSchema.extend({
    id: zod_1.z.string().uuid()
});
const mergeParamsSchema = zod_1.z.object({
    treeId: zod_1.z.string().uuid(),
    sourceId: zod_1.z.string().uuid(),
    targetId: zod_1.z.string().uuid()
});
async function peopleRoutes(fastify) {
    /**
     * Global person lookup (no tree isolation)
     */
    fastify.get('/people/:id/global', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = zod_1.z.object({ id: zod_1.z.string().uuid() }).parse(request.params);
        const person = await people_repository_1.PeopleRepository.findByIdGlobal(id);
        if (!person)
            throw new errors_1.AppError('Profile not found', 404);
        return { success: true, data: person };
    });
    /**
     * Create a new person
     */
    fastify.post('/trees/:treeId/people', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member'])]
    }, async (request, reply) => {
        const user = request.user;
        const { treeId } = treeIdParamSchema.parse(request.params);
        const body = people_1.createPersonSchema.parse({ ...request.body, treeId });
        const person = await people_service_1.PeopleService.createPerson(body, user.id);
        return { success: true, data: person };
    });
    /**
     * Merge two profiles
     * Access: Admin
     */
    fastify.post('/trees/:treeId/people/:sourceId/merge-into/:targetId', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const user = request.user;
        const { treeId, sourceId, targetId } = mergeParamsSchema.parse(request.params);
        const result = await people_service_1.PeopleService.mergePeople(sourceId, targetId, user.id, treeId);
        return result;
    });
    /**
     * Get personalized neighborhood view of the tree
     */
    fastify.get('/trees/:treeId/neighborhood', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member', 'viewer'])]
    }, async (request, reply) => {
        const user = request.user;
        const { treeId } = treeIdParamSchema.parse(request.params);
        const neighborhood = await people_service_1.PeopleService.getNeighborhood(treeId, user.id);
        return { success: true, data: neighborhood };
    });
    /**
     * List all people in a tree
     */
    fastify.get('/trees/:treeId/people', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member', 'viewer'])]
    }, async (request, reply) => {
        const { treeId } = treeIdParamSchema.parse(request.params);
        const people = await people_service_1.PeopleService.listPeople(treeId);
        return { success: true, data: people };
    });
    /**
     * Get person details (filtered by privacy)
     */
    fastify.get('/trees/:treeId/people/:id', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member', 'viewer'])]
    }, async (request, reply) => {
        const user = request.user;
        const { treeId, id } = personIdParamSchema.parse(request.params);
        const person = await people_service_1.PeopleService.getPerson(id, treeId, user.id);
        return { success: true, data: person };
    });
    /**
     * Update person profile
     */
    fastify.patch('/trees/:treeId/people/:id', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member'])]
    }, async (request, reply) => {
        const user = request.user;
        const { treeId, id } = personIdParamSchema.parse(request.params);
        const body = people_1.updatePersonSchema.parse(request.body);
        const person = await people_service_1.PeopleService.updatePerson(id, treeId, body, user.id);
        return { success: true, data: person };
    });
    /**
     * Soft delete person
     */
    fastify.delete('/trees/:treeId/people/:id', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member'])]
    }, async (request, reply) => {
        const user = request.user;
        const { treeId, id } = personIdParamSchema.parse(request.params);
        await people_service_1.PeopleService.deletePerson(id, treeId, user.id);
        return { success: true, message: 'Person deleted successfully' };
    });
    /**
     * Get person permissions
     */
    fastify.get('/trees/:treeId/people/:id/permissions', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member'])]
    }, async (request, reply) => {
        const user = request.user;
        const { treeId, id } = personIdParamSchema.parse(request.params);
        const permissions = await people_service_1.PeopleService.getPermissions(id, treeId, user.id);
        return { success: true, data: permissions };
    });
    /**
     * Grant person permission
     */
    fastify.post('/trees/:treeId/people/:id/permissions', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member'])]
    }, async (request, reply) => {
        const user = request.user;
        const { treeId, id } = personIdParamSchema.parse(request.params);
        const { userId, permission } = request.body;
        const result = await people_service_1.PeopleService.grantPermission(id, treeId, userId, permission, user.id);
        return result;
    });
    /**
     * Revoke person permission
     */
    fastify.delete('/trees/:treeId/people/:id/permissions/:userId', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member'])]
    }, async (request, reply) => {
        const user = request.user;
        const { treeId, id, userId } = zod_1.z.object({
            treeId: zod_1.z.string().uuid(),
            id: zod_1.z.string().uuid(),
            userId: zod_1.z.string().uuid()
        }).parse(request.params);
        const result = await people_service_1.PeopleService.revokePermission(id, treeId, userId, user.id);
        return result;
    });
}
