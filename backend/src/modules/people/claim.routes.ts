import { FastifyInstance } from 'fastify';
import { claimProfileSchema } from '@shared/schemas/invitations';
import { PeopleService } from './people.service';
import { verifyTreeAccess } from '../../middleware/tree-auth';

export default async function claimRoutes(fastify: FastifyInstance) {
  
  /**
   * Claim a ghost profile
   * Access: Any authenticated user
   */
  fastify.post('/people/:personId/claim', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user!;
    const { personId } = request.params as { personId: string };
    
    const result = await PeopleService.claimProfile(personId, user.id);
    return result;
  });

  /**
   * List pending claim requests for a tree
   * Access: Admin
   */
  fastify.get('/trees/:treeId/claim-requests', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const { treeId } = request.params as any;
    const requests = await PeopleService.getPendingClaimRequests(treeId);
    return { success: true, data: requests };
  });

  /**
   * Approve claim request
   * Access: Admin
   */
  fastify.post('/trees/:treeId/claim-requests/:requestId/approve', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { requestId } = request.params as any;
    
    const result = await PeopleService.approveClaimRequest(requestId, user.id);
    return result;
  });

  /**
   * Reject claim request
   * Access: Admin
   */
  fastify.post('/trees/:treeId/claim-requests/:requestId/reject', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { requestId } = request.params as any;
    
    const result = await PeopleService.rejectClaimRequest(requestId, user.id);
    return result;
  });
}
