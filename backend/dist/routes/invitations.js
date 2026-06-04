"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = invitationRoutes;
const invitations_1 = require("@shared/schemas/invitations");
const invitations_service_1 = require("../modules/invitations/invitations.service");
const invitations_repository_1 = require("../modules/invitations/invitations.repository");
const tree_auth_1 = require("../middleware/tree-auth");
const config_1 = require("../core/config");
const errors_1 = require("../core/errors");
async function invitationRoutes(fastify) {
    /**
     * Generate an invitation link
     * Access: Admin only
     */
    fastify.post('/trees/:treeId/invitations', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const { treeId } = request.params;
        const { invitationType, targetEmail } = invitations_1.generateInvitationSchema.parse(request.body);
        const user = request.user;
        const invite = await invitations_service_1.InvitationsService.generateInvitation(treeId, invitationType, user.id, targetEmail);
        return {
            success: true,
            data: {
                ...invite,
                url: `${config_1.config.FRONTEND_URL}/join/${invite.token}`
            }
        };
    });
    /**
     * List active invitations for a tree
     */
    fastify.get('/trees/:treeId/invitations', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const { treeId } = request.params;
        const invitations = await invitations_repository_1.InvitationsRepository.listInvitations(treeId);
        return {
            success: true,
            activeInvitations: invitations.map(inv => ({
                ...inv,
                invitationUrl: `${config_1.config.FRONTEND_URL}/join/${inv.token}`
            }))
        };
    });
    /**
     * Get invitation info (public)
     */
    fastify.get('/invitations/:token', async (request, reply) => {
        const { token } = request.params;
        const invite = await invitations_repository_1.InvitationsRepository.findInvitationByToken(token);
        if (!invite)
            throw new errors_1.AppError('Invitation not found', 404);
        if (invite.expiresAt < Date.now())
            throw new errors_1.AppError('Invitation expired', 410);
        return {
            success: true,
            data: {
                treeId: invite.treeId,
                invitationType: invite.invitationType,
                expiresAt: invite.expiresAt
            }
        };
    });
    /**
     * Accept invitation
     */
    fastify.post('/invitations/:token/accept', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { token } = request.params;
        const user = request.user;
        const result = await invitations_service_1.InvitationsService.acceptInvitation(token, user.id);
        return result;
    });
    /**
     * List pending access requests
     */
    fastify.get('/trees/:treeId/access-requests', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const { treeId } = request.params;
        const requests = await invitations_service_1.InvitationsService.getPendingRequests(treeId);
        return { success: true, data: requests };
    });
    /**
     * Approve access request
     */
    fastify.post('/trees/:treeId/access-requests/:requestId/approve', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const user = request.user;
        const { requestId } = request.params;
        const result = await invitations_service_1.InvitationsService.approveRequest(requestId, user.id);
        return result;
    });
}
