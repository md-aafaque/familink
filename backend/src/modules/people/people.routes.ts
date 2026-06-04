import { FastifyInstance } from 'fastify';
import { createPersonSchema, updatePersonSchema } from '@shared/schemas/people';
import { PeopleService } from './people.service';
import { verifyTreeAccess } from '../../middleware/tree-auth';

export default async function peopleRoutes(fastify: FastifyInstance) {
  
  /**
   * Create a new person
   */
  fastify.post('/trees/:treeId/people', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId } = request.params as { treeId: string };
    const body = createPersonSchema.parse({ ...request.body as any, treeId });
    
    const person = await PeopleService.createPerson(body, user.id);
    return { success: true, data: person };
  });

  /**
   * Merge two profiles
   * Access: Admin
   */
  fastify.post('/trees/:treeId/people/:sourceId/merge-into/:targetId', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId, sourceId, targetId } = request.params as any;
    
    const result = await PeopleService.mergePeople(sourceId, targetId, user.id, treeId);
    return result;
  });

  /**
   * Get personalized neighborhood view of the tree
   */
  fastify.get('/trees/:treeId/neighborhood', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const user = request.user!;
    const { treeId } = request.params as { treeId: string };
    
    const neighborhood = await PeopleService.getNeighborhood(treeId, user.id);
    return { success: true, data: neighborhood };
  });

  /**
   * List all people in a tree
   */
  fastify.get('/trees/:treeId/people', { preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] }, async (request, reply) => {
    const { treeId } = request.params as { treeId: string };
    const people = await PeopleService.listPeople(treeId);
    return { success: true, data: people };
  });

  /**
   * Get person details (filtered by privacy)
   */
  fastify.get('/people/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    
    const person = await PeopleService.getPerson(id, user.id);
    return { success: true, data: person };
  });

  /**
   * Update person profile
   */
  fastify.patch('/people/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    const body = updatePersonSchema.parse(request.body);
    
    const person = await PeopleService.updatePerson(id, body, user.id);
    return { success: true, data: person };
  });

  /**
   * Soft delete person
   */
  fastify.delete('/people/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    
    await PeopleService.deletePerson(id, user.id);
    return { success: true, message: 'Person deleted successfully' };
  });

  /**
   * Get person permissions
   */
  fastify.get('/people/:id/permissions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    const permissions = await PeopleService.getPermissions(id, user.id);
    return { success: true, data: permissions };
  });

  /**
   * Grant person permission
   */
  fastify.post('/people/:id/permissions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    const { userId, permission } = request.body as { userId: string, permission: 'owner' | 'editor' };
    const result = await PeopleService.grantPermission(id, userId, permission, user.id);
    return result;
  });

  /**
   * Revoke person permission
   */
  fastify.delete('/people/:id/permissions/:userId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const { id, userId } = request.params as { id: string, userId: string };
    const result = await PeopleService.revokePermission(id, userId, user.id);
    return result;
  });
}
