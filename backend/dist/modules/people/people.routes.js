"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = peopleRoutes;
const people_1 = require("@shared/schemas/people");
const people_service_1 = require("./people.service");
const tree_auth_1 = require("../../middleware/tree-auth");
async function peopleRoutes(fastify) {
    /**
     * Create a new person
     */
    fastify.post('/trees/:treeId/people', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member'])]
    }, async (request, reply) => {
        const user = request.user;
        const { treeId } = request.params;
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
        const { treeId, sourceId, targetId } = request.params;
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
        const { treeId } = request.params;
        const neighborhood = await people_service_1.PeopleService.getNeighborhood(treeId, user.id);
        return { success: true, data: neighborhood };
    });
    /**
     * List all people in a tree
     */
    fastify.get('/trees/:treeId/people', { preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member', 'viewer'])] }, async (request, reply) => {
        const { treeId } = request.params;
        const people = await people_service_1.PeopleService.listPeople(treeId);
        return { success: true, data: people };
    });
    /**
     * Get person details (filtered by privacy)
     */
    fastify.get('/people/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const person = await people_service_1.PeopleService.getPerson(id, user.id);
        return { success: true, data: person };
    });
    /**
     * Update person profile
     */
    fastify.patch('/people/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const body = people_1.updatePersonSchema.parse(request.body);
        const person = await people_service_1.PeopleService.updatePerson(id, body, user.id);
        return { success: true, data: person };
    });
    /**
     * Soft delete person
     */
    fastify.delete('/people/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        await people_service_1.PeopleService.deletePerson(id, user.id);
        return { success: true, message: 'Person deleted successfully' };
    });
    /**
     * Get person permissions
     */
    fastify.get('/people/:id/permissions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const permissions = await people_service_1.PeopleService.getPermissions(id, user.id);
        return { success: true, data: permissions };
    });
    /**
     * Grant person permission
     */
    fastify.post('/people/:id/permissions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const { userId, permission } = request.body;
        const result = await people_service_1.PeopleService.grantPermission(id, userId, permission, user.id);
        return result;
    });
    /**
     * Revoke person permission
     */
    fastify.delete('/people/:id/permissions/:userId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { id, userId } = request.params;
        const result = await people_service_1.PeopleService.revokePermission(id, userId, user.id);
        return result;
    });
}
