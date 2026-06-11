import Fastify from 'fastify';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth';
import { config } from './core/config';
import { handleError } from './core/errors';

// Modular Route Imports
import peopleRoutes from './modules/people/people.routes';
import treeRoutes from './modules/trees/trees.routes';
import authRoutes from './modules/users/users.routes';
import invitationsRoutes from './modules/invitations/invitations.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import claimRoutes from './modules/people/claim.routes';
import relationshipsRoutes from './modules/relationships/relationships.routes';
import auditRoutes from './modules/audit/audit.routes';
import memoryRoutes from './modules/memories/memories.routes';

const server = Fastify({
  logger: true,
});

async function start() {
  // Error Handler
  server.setErrorHandler(handleError);

  // Plugins
  await server.register(cors, { 
    origin: config.FRONTEND_URL,
    credentials: true 
  });
  
  await server.register(authPlugin);
  
  // Feature Routes (Modular Monolith Style)
  await server.register(async (api) => {
    await api.register(authRoutes);
    await api.register(peopleRoutes);
    await api.register(treeRoutes);
    await api.register(notificationsRoutes);
    await api.register(invitationsRoutes);
    await api.register(claimRoutes);
    await api.register(relationshipsRoutes);
    await api.register(auditRoutes);
    await api.register(memoryRoutes);
  }, { prefix: '/api' });

  // Health check
  server.get('/health', async () => ({ status: 'ok' }));

  try {
    const port = parseInt(config.PORT, 10);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server ready at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
