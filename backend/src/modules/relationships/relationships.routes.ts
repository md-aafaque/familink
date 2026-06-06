import { FastifyInstance } from 'fastify';
import { createProposalSchema, rejectProposalSchema } from '@shared/schemas/relationships';
import { RelationshipsService } from './relationships.service';
import { verifyTreeAccess } from '../../middleware/tree-auth';
import { getSession } from '../../core/database';
import { AppError } from '../../core/errors';

export default async function relationshipsRoutes(fastify: FastifyInstance) {
  
  /**
   * Get suggested relationships for a person
   */
  fastify.get('/trees/:treeId/people/:id/suggestions', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { id, treeId } = request.params as { id: string, treeId: string };
    const suggestions = await RelationshipsService.getSuggestedRelationships(id, treeId);
    return { success: true, data: suggestions };
  });

  /**
   * Propose a new relationship
   * Access: Admin or Member
   */
  fastify.post('/trees/:treeId/relationship-proposals', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const body = createProposalSchema.parse({ 
      ...request.body as any, 
      treeId: (request.params as any).treeId 
    });
    
    const proposal = await RelationshipsService.proposeRelationship(body, user.id);
    return { success: true, data: proposal };
  });

  /**
   * Get all pending proposals for a tree
   * Access: Admin
   */
  fastify.get('/trees/:treeId/relationship-proposals', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])] 
  }, async (request, reply) => {
    const { treeId } = request.params as any;
    const proposals = await RelationshipsService.getPendingProposals(treeId);
    return { success: true, data: proposals };
  });

  /**
   * Approve a proposal
   * Access: Admin
   */
  fastify.post('/trees/:treeId/relationship-proposals/:proposalId/approve', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { proposalId } = request.params as any;
    
    const result = await RelationshipsService.approveProposal(proposalId, user.id);
    return result;
  });

  /**
   * Reject a proposal
   * Access: Admin
   */
  fastify.post('/trees/:treeId/relationship-proposals/:proposalId/reject', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { proposalId } = request.params as any;
    const { reason } = rejectProposalSchema.parse(request.body);
    
    const result = await RelationshipsService.rejectProposal(proposalId, reason, user.id);
    return result;
  });
}
