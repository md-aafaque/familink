import { FastifyInstance } from 'fastify';
import peopleRoutes from '../modules/people/people.routes';
import relationshipsRoutes from '../modules/relationships/relationships.routes';
import claimRoutes from '../modules/people/claim.routes';
import treeRoutes from '../modules/trees/trees.routes';
import notificationsRoutes from '../modules/notifications/notifications.routes';
import invitationRoutes from '../modules/invitations/invitations.routes';
import authRoutes from '../modules/users/users.routes';
import adminRoutes from '../modules/audit/audit.routes';

export default async function routes(fastify: FastifyInstance) {
  // Authentication routes
  await fastify.register(authRoutes);
  
  // Feature routes
  await fastify.register(peopleRoutes);
  await fastify.register(relationshipsRoutes);
  await fastify.register(claimRoutes);
  await fastify.register(treeRoutes);
  await fastify.register(notificationsRoutes);
  await fastify.register(invitationRoutes);
  await fastify.register(adminRoutes);
}
