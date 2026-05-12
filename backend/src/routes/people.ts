import { FastifyInstance } from 'fastify';
import { createPersonSchema, updatePersonSchema } from '@shared/schemas/people';
import { PeopleService } from '../modules/people/people.service';
import { verifyTreeAccess } from '../middleware/tree-auth';
import { getSession } from '../core/database';

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
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person {treeId: $treeId}) WHERE p.deletedAt IS NULL RETURN p ORDER BY p.firstName ASC`,
        { treeId }
      );
      const people = result.records.map(r => r.get('p').properties);
      return { success: true, data: people };
    } finally {
      await session.close();
    }
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
}
