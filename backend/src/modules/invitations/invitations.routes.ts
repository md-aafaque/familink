import { FastifyInstance } from 'fastify';
import { generateInvitationSchema, createAdminInvitationSchema, rejectAccessRequestSchema } from '../../shared/schemas/invitations';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { verifyTreeAccess } from '../../middleware/tree-auth';
import { config } from '../../core/config';
import { AppError } from '../../core/errors';
import { z } from 'zod';

const treeIdParamSchema = z.object({
  treeId: z.string().uuid()
});

const invitationIdParamSchema = treeIdParamSchema.extend({
  invitationId: z.string().uuid()
});

const requestIdParamSchema = treeIdParamSchema.extend({
  requestId: z.string().uuid()
});

export default async function invitationRoutes(fastify: FastifyInstance) {
  
  /**
   * Generate an invitation link
   * Access: Admin only
   */
  fastify.post('/trees/:treeId/invitations/generate', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const { role } = generateInvitationSchema.parse(request.body);
    const user = request.user!;

    const invite = await InvitationsService.generateInvitation(treeId, role, user.id);
    
    return { 
      success: true, 
      data: {
        ...invite,
        url: `${config.FRONTEND_URL}/join/${invite.token}`
      } 
    };
  });

  /**
   * Create an email-specific admin invitation
   */
  fastify.post('/trees/:treeId/admin-invitations', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const { email } = createAdminInvitationSchema.parse(request.body);
    const user = request.user!;

    const invite = await InvitationsService.createAdminInvitation(treeId, email, user.id);
    return { success: true, data: invite };
  });

  /**
   * List active invitations for a tree
   */
  fastify.get('/trees/:treeId/invitations', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const invitations = await InvitationsRepository.listInvitations(treeId);
    
    return { 
      success: true, 
      activeInvitations: invitations.map(inv => ({
        ...inv,
        invitationUrl: `${config.FRONTEND_URL}/join/${inv.token}`
      }))
    };
  });

  /**
   * Get invitation info (public)
   */
  fastify.get('/invitations/:token', async (request, reply) => {
    const { token } = z.object({ token: z.string() }).parse(request.params);
    const invite = await InvitationsRepository.findInvitationByToken(token);
    
    if (!invite) throw new AppError('Invitation not found', 404);
    if (invite.expiresAt < Date.now()) throw new AppError('Invitation expired', 410);

    return { 
      success: true, 
      data: {
        treeId: invite.treeId,
        role: invite.role,
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
    const { token } = z.object({ token: z.string() }).parse(request.params);
    const user = request.user!;

    const result = await InvitationsService.acceptInvitation(token, user.id);
    return result;
  });

  /**
   * List pending access requests
   */
  fastify.get('/trees/:treeId/access-requests', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const requests = await InvitationsService.getPendingRequests(treeId);
    return { success: true, data: requests };
  });

  /**
   * Approve access request
   */
  fastify.post('/trees/:treeId/access-requests/:requestId/approve', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, requestId } = requestIdParamSchema.parse(request.params);
    
    const result = await InvitationsService.approveRequest(requestId, user.id);
    return result;
  });

  /**
   * Reject access request
   */
  fastify.post('/trees/:treeId/access-requests/:requestId/reject', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, requestId } = requestIdParamSchema.parse(request.params);
    const { reason } = rejectAccessRequestSchema.parse(request.body);

    const result = await InvitationsService.rejectRequest(requestId, reason, user.id);
    return result;
  });

  /**
   * Revoke an active invitation
   */
  fastify.post('/trees/:treeId/invitations/:invitationId/revoke', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, invitationId } = invitationIdParamSchema.parse(request.params);

    const result = await InvitationsService.revokeInvitation(treeId, invitationId, user.id);
    return result;
  });
}
