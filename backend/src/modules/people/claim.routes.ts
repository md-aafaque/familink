import { FastifyInstance } from 'fastify';
import { PeopleService } from './people.service';
import { verifyTreeAccess } from '../../middleware/tree-auth';
import { z } from 'zod';

const treeIdParamSchema = z.object({
  treeId: z.string().uuid()
});

const claimParamsSchema = z.object({
  treeId: z.string().uuid(),
  personId: z.string().uuid()
});

const claimActionParamsSchema = z.object({
  treeId: z.string().uuid(),
  claimId: z.string().uuid()
});

export default async function claimRoutes(fastify: FastifyInstance) {
  
  /**
   * Claim a ghost profile
   * Access: Any authenticated user
   */
  fastify.post('/trees/:treeId/people/:personId/claim', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, personId } = claimParamsSchema.parse(request.params);
    
    const result = await PeopleService.claimProfile(personId, treeId, user.id);
    return result;
  });

  /**
   * List pending claim requests for a tree
   * Access: Admin
   */
  fastify.get('/trees/:treeId/claims', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const requests = await PeopleService.getPendingClaimRequests(treeId);
    return { success: true, data: requests };
  });

  /**
   * Approve claim request
   * Access: Admin
   */
  fastify.post('/trees/:treeId/claims/:claimId/approve', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { claimId } = claimActionParamsSchema.parse(request.params);
    
    const result = await PeopleService.approveClaimRequest(claimId, user.id);
    return result;
  });

  /**
   * Reject claim request
   * Access: Admin
   */
  fastify.post('/trees/:treeId/claims/:claimId/reject', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { claimId } = claimActionParamsSchema.parse(request.params);
    
    const result = await PeopleService.rejectClaimRequest(claimId, user.id);
    return result;
  });
}
