"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = claimRoutes;
const people_service_1 = require("./people.service");
const tree_auth_1 = require("../../middleware/tree-auth");
async function claimRoutes(fastify) {
    /**
     * Claim a ghost profile
     * Access: Any authenticated user
     */
    fastify.post('/people/:personId/claim', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const user = request.user;
        const { personId } = request.params;
        const result = await people_service_1.PeopleService.claimProfile(personId, user.id);
        return result;
    });
    /**
     * List pending claim requests for a tree
     * Access: Admin
     */
    fastify.get('/trees/:treeId/claim-requests', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const { treeId } = request.params;
        const requests = await people_service_1.PeopleService.getPendingClaimRequests(treeId);
        return { success: true, data: requests };
    });
    /**
     * Approve claim request
     * Access: Admin
     */
    fastify.post('/trees/:treeId/claim-requests/:requestId/approve', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const user = request.user;
        const { requestId } = request.params;
        const result = await people_service_1.PeopleService.approveClaimRequest(requestId, user.id);
        return result;
    });
    /**
     * Reject claim request
     * Access: Admin
     */
    fastify.post('/trees/:treeId/claim-requests/:requestId/reject', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const user = request.user;
        const { requestId } = request.params;
        const result = await people_service_1.PeopleService.rejectClaimRequest(requestId, user.id);
        return result;
    });
}
