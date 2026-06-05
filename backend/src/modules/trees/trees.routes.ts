import { FastifyInstance } from 'fastify';
import { verifyTreeAccess } from '../../middleware/tree-auth';
import { createTreeSchema } from '../../shared/schemas/trees';
import { TreesService } from './trees.service';
import { AuditService } from '../../modules/audit/audit.service';
import { z } from 'zod';

const treeIdParamSchema = z.object({
  treeId: z.string().uuid()
});

export default async function treeRoutes(fastify: FastifyInstance) {
  
  /**
   * Create a new family tree
   */
  fastify.post('/trees', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name } = createTreeSchema.parse(request.body);
    const user = request.user!;

    const tree = await TreesService.createTree(
      name, 
      user.id, 
      user.email, 
      user.email?.split('@')[0] || 'Admin'
    );

    return { 
      success: true, 
      data: tree 
    };
  });

  /**
   * Get all trees the user is a member of (including pending requests)
   */
  fastify.get('/trees', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const trees = await TreesService.getUserTrees(user.id);
    return { success: true, data: trees };
  });

  /**
   * Get specific tree details
   */
  fastify.get('/trees/:treeId', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const tree = await TreesService.getTreeDetails(treeId);

    return { 
      success: true, 
      data: {
        ...tree,
        role: request.treeRole
      }
    };
  });

  /**
   * Visual Tree Data
   */
  fastify.get('/trees/:treeId/visual', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const people = await TreesService.getVisualData(treeId);
    return { success: true, data: people };
  });

  /**
   * Get all members (users) of a tree
   */
  fastify.get('/trees/:treeId/members', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const members = await TreesService.getMembers(treeId);
    return { success: true, data: members };
  });

  /**
   * Rename tree
   */
  fastify.patch('/trees/:treeId', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const { name } = createTreeSchema.parse(request.body);
    const user = request.user!;
    
    await TreesService.renameTree(treeId, user.id, name);
    return { success: true };
  });

  /**
   * Delete tree
   */
  fastify.delete('/trees/:treeId', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const user = request.user!;
    
    await TreesService.deleteTree(treeId, user.id);
    return { success: true };
  });
}
