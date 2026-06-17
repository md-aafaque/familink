import { FastifyInstance } from 'fastify';
import { createPersonSchema, updatePersonSchema, deletionProposalSchema } from '../../shared/schemas/people';
import { PeopleService } from './people.service';
import { PeopleRepository } from './people.repository';
import { verifyTreeAccess } from '../../middleware/tree-auth';
import { AppError } from '../../core/errors';
import { z } from 'zod';

const treeIdParamSchema = z.object({
  treeId: z.string().uuid()
});

const personIdParamSchema = treeIdParamSchema.extend({
  id: z.string().uuid()
});

const mergeParamsSchema = z.object({
  treeId: z.string().uuid(),
  sourceId: z.string().uuid(),
  targetId: z.string().uuid()
});

export default async function peopleRoutes(fastify: FastifyInstance) {
  
  /**
   * Global person lookup (no tree isolation)
   */
  fastify.get('/people/:id/global', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const person = await PeopleRepository.findByIdGlobal(id);
    if (!person) throw new AppError('Profile not found', 404);

    const permission = await PeopleRepository.checkPermission(id, user.id);

    return { 
      success: true, 
      data: {
        ...person,
        userPermission: permission
      } 
    };
  });

  /**
   * Create a new person
   */
  fastify.post('/trees/:treeId/people', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId } = treeIdParamSchema.parse(request.params);
    const body = createPersonSchema.parse({ ...request.body as object, treeId });
    
    const person = await PeopleService.createPerson(body, user.id);
    return { success: true, data: person };
  });

  /**
   * Merge two profiles
   * Access: Admin or Member (Members create proposals)
   */
  fastify.post('/trees/:treeId/people/:sourceId/merge-into/:targetId', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, sourceId, targetId } = mergeParamsSchema.parse(request.params);
    const { reason } = z.object({ reason: z.string().optional() }).parse(request.body);
    
    const result = await PeopleService.mergePeople(sourceId, targetId, user.id, treeId, reason);
    return result;
  });

  /**
   * Get all pending merge proposals for a tree
   * Access: Admin
   */
  fastify.get('/trees/:treeId/merge-proposals', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const proposals = await PeopleService.getPendingMergeProposals(treeId);
    return { success: true, data: proposals };
  });

  /**
   * Approve merge proposal
   * Access: Admin
   */
  fastify.post('/trees/:treeId/merge-proposals/:proposalId/approve', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { proposalId } = z.object({ proposalId: z.string().uuid() }).parse(request.params);
    
    const result = await PeopleService.approveMergeProposal(proposalId, user.id);
    return result;
  });

  /**
   * Reject merge proposal
   * Access: Admin
   */
  fastify.post('/trees/:treeId/merge-proposals/:proposalId/reject', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { proposalId } = z.object({ proposalId: z.string().uuid() }).parse(request.params);
    
    const result = await PeopleService.rejectMergeProposal(proposalId, user.id);
    return result;
  });

  /**
   * Get personalized neighborhood view of the tree
   */
  fastify.get('/trees/:treeId/neighborhood', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId } = treeIdParamSchema.parse(request.params);
    
    const neighborhood = await PeopleService.getNeighborhood(treeId, user.id);
    return { success: true, data: neighborhood };
  });

  /**
   * List all people in a tree
   */
  fastify.get('/trees/:treeId/people', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const people = await PeopleService.listPeople(treeId);
    return { success: true, data: people };
  });

  /**
   * Get person details (filtered by privacy)
   */
  fastify.get('/trees/:treeId/people/:id', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, id } = personIdParamSchema.parse(request.params);
    
    const person = await PeopleService.getPerson(id, treeId, user.id);
    return { success: true, data: person };
  });

  /**
   * Update person profile
   */
  fastify.patch('/trees/:treeId/people/:id', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, id } = personIdParamSchema.parse(request.params);
    const body = updatePersonSchema.parse(request.body);
    
    const person = await PeopleService.updatePerson(id, treeId, body, user.id);
    return { success: true, data: person };
  });

  /**
   * Soft delete person
   */
  fastify.delete('/trees/:treeId/people/:id', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, id } = personIdParamSchema.parse(request.params);
    
    await PeopleService.deletePerson(id, treeId, user.id);
    return { success: true, message: 'Person deleted successfully' };
  });

  /**
   * Propose person deletion
   */
  fastify.post('/trees/:treeId/people/:id/propose-deletion', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, id } = personIdParamSchema.parse(request.params);
    const { reason } = deletionProposalSchema.parse(request.body);

    const proposal = await PeopleService.proposeDeletion(id, treeId, user.id, reason);
    return { success: true, data: proposal };
  });

  /**
   * Get all pending deletion proposals for a tree
   * Access: Admin
   */
  fastify.get('/trees/:treeId/deletion-proposals', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const proposals = await PeopleService.getPendingDeletionProposals(treeId);
    return { success: true, data: proposals };
  });

  /**
   * Approve deletion proposal
   * Access: Admin
   */
  fastify.post('/trees/:treeId/deletion-proposals/:proposalId/approve', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { proposalId } = z.object({ proposalId: z.string().uuid() }).parse(request.params);
    
    const result = await PeopleService.approveDeletionProposal(proposalId, user.id);
    return result;
  });

  /**
   * Reject deletion proposal
   * Access: Admin
   */
  fastify.post('/trees/:treeId/deletion-proposals/:proposalId/reject', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { proposalId } = z.object({ proposalId: z.string().uuid() }).parse(request.params);
    
    const result = await PeopleService.rejectDeletionProposal(proposalId, user.id);
    return result;
  });

  /**
   * Get person permissions
   */
  fastify.get('/trees/:treeId/people/:id/permissions', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, id } = personIdParamSchema.parse(request.params);
    const permissions = await PeopleService.getPermissions(id, treeId, user.id);
    return { success: true, data: permissions };
  });

  /**
   * Grant person permission
   */
  fastify.post('/trees/:treeId/people/:id/permissions', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, id } = personIdParamSchema.parse(request.params);
    const { userId, permission } = request.body as { userId: string, permission: 'owner' | 'editor' };
    const result = await PeopleService.grantPermission(id, treeId, userId, permission, user.id);
    return result;
  });

  /**
   * Revoke person permission
   */
  fastify.delete('/trees/:treeId/people/:id/permissions/:userId', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, id, userId } = z.object({
      treeId: z.string().uuid(),
      id: z.string().uuid(),
      userId: z.string().uuid()
    }).parse(request.params);
    const result = await PeopleService.revokePermission(id, treeId, userId, user.id);
    return result;
  });

  /**
   * Get signed upload URL for profile pictures
   */
  fastify.post('/trees/:treeId/people/upload-url', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])]
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const { fileName } = z.object({ fileName: z.string() }).parse(request.body);

    const data = await PeopleService.getUploadUrl(treeId, fileName);
    return { success: true, data };
  });
}
