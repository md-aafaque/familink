import { FastifyInstance } from 'fastify';
import peopleRoutes from './people';
import relationshipsRoutes from './relationships';
import claimRoutes from './claim';
import treeRoutes from './tree';
import notificationsRoutes from './notifications';
import invitationRoutes from './invitations';
import authRoutes from './auth';

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
}
