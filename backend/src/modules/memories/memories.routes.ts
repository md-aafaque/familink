import { FastifyInstance } from 'fastify';
import { verifyTreeAccess } from '../../middleware/tree-auth';
import { CreateMemorySchema, UpdateMemorySchema } from '../../shared/schemas/memories';
import { MemoriesService } from './memories.service';
import { z } from 'zod';

const treeIdParamSchema = z.object({
  treeId: z.string().uuid()
});

const memoryIdParamSchema = treeIdParamSchema.extend({
  id: z.string().uuid()
});

const personIdParamSchema = treeIdParamSchema.extend({
  personId: z.string().uuid()
});

export default async function memoryRoutes(fastify: FastifyInstance) {
  
  /**
   * Create a new memory
   */
  fastify.post('/trees/:treeId/memories', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const input = CreateMemorySchema.parse({ ...request.body as any, treeId });
    const user = request.user!;

    const memory = await MemoriesService.createMemory(user.id, input);

    return { success: true, data: memory };
  });

  /**
   * Get all memories for a tree (Family Wall)
   */
  fastify.get('/trees/:treeId/memories', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const { limit } = z.object({ limit: z.string().optional() }).parse(request.query);
    
    const memories = await MemoriesService.getTreeMemories(treeId, limit ? parseInt(limit) : 50);
    return { success: true, data: memories };
  });

  /**
   * Get memories for a specific person (Timeline)
   */
  fastify.get('/trees/:treeId/people/:personId/memories', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId, personId } = personIdParamSchema.parse(request.params);
    
    const memories = await MemoriesService.getPersonMemories(treeId, personId);
    return { success: true, data: memories };
  });

  /**
   * Update a memory
   */
  fastify.patch('/trees/:treeId/memories/:id', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const { treeId, id } = memoryIdParamSchema.parse(request.params);
    const input = UpdateMemorySchema.parse(request.body);
    const user = request.user!;

    const memory = await MemoriesService.updateMemory(id, treeId, user.id, input);
    return { success: true, data: memory };
  });

  /**
   * Delete a memory
   */
  fastify.delete('/trees/:treeId/memories/:id', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const { treeId, id } = memoryIdParamSchema.parse(request.params);
    const user = request.user!;

    await MemoriesService.deleteMemory(id, treeId, user.id);
    return { success: true };
  });

  /**
   * Get signed download URL for photos
   */
  fastify.post('/trees/:treeId/memories/download-url', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const { path } = z.object({ path: z.string() }).parse(request.body);

    const signedUrl = await MemoriesService.getDownloadUrl(path);
    return { success: true, data: { signedUrl } };
  });

  /**
   * Get signed upload URL for photos
   */
  fastify.post('/trees/:treeId/memories/upload-url', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const { fileName } = z.object({ fileName: z.string() }).parse(request.body);

    const data = await MemoriesService.getUploadUrl(treeId, fileName);
    return { success: true, data };
  });
}
