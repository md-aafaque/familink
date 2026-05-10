import { FastifyInstance } from 'fastify';
import peopleRoutes from './people';
import relationshipsRoutes from './relationships';
import accessRoutes from './access';
import claimRoutes from './claim';
import treeRoutes from './tree';
import authRoutes from './auth';
import adminRoutes from './admin';
import notificationsRoutes from './notifications';
import invitationRoutes from './invitations';

export default async function routes(fastify: FastifyInstance) {
  await fastify.register(authRoutes);
  await fastify.register(adminRoutes);
  await fastify.register(peopleRoutes);
  await fastify.register(relationshipsRoutes);
  await fastify.register(accessRoutes);
  await fastify.register(claimRoutes);
  await fastify.register(treeRoutes);
  await fastify.register(notificationsRoutes);
  await fastify.register(invitationRoutes);
}
