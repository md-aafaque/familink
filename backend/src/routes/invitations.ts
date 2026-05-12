import { FastifyInstance } from 'fastify';
import { generateInvitationSchema, acceptInvitationSchema, processRequestSchema } from '@shared/schemas/invitations';
import { InvitationsService } from '../modules/invitations/invitations.service';
import { InvitationsRepository } from '../modules/invitations/invitations.repository';
import { verifyTreeAccess } from '../middleware/tree-auth';
import { config } from '../core/config';
import { AppError } from '../core/errors';

export default async function invitationRoutes(fastify: FastifyInstance) {
  
  /**
   * Generate an invitation link
   * Access: Admin only
   */
  fastify.post('/trees/:treeId/invitations', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])] 
  }, async (request, reply) => {
    const { treeId } = request.params as any;
    const { invitationType } = generateInvitationSchema.parse(request.body);
    const user = request.user!;

    const invite = await InvitationsService.generateInvitation(treeId, invitationType, user.id);
    
    return { 
      success: true, 
      data: {
        ...invite,
        url: `${config.FRONTEND_URL}/join/${invite.token}`
      } 
    };
  });

  /**
   * List active invitations for a tree
   */
  fastify.get('/trees/:treeId/invitations', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])] 
  }, async (request, reply) => {
    const { treeId } = request.params as any;
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
    const { token } = request.params as { token: string };
    const invite = await InvitationsRepository.findInvitationByToken(token);
    
    if (!invite) throw new AppError('Invitation not found', 404);
    if (invite.expiresAt < Date.now()) throw new AppError('Invitation expired', 410);

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
    const { token } = request.params as { token: string };
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
    const { treeId } = request.params as any;
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
    const { requestId } = request.params as any;
    
    const result = await InvitationsService.approveRequest(requestId, user.id);
    return result;
  });
}
