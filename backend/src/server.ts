import Fastify from 'fastify';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth';
import { config } from './core/config';
import { handleError } from './core/errors';
import peopleRoutes from './routes/people';
import treeRoutes from './routes/tree';
import authRoutes from './routes/auth';
import invitationsRoutes from './routes/invitations';
import notificationsRoutes from './routes/notifications';
import claimRoutes from './routes/claim';
import relationshipsRoutes from './routes/relationships';

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
  }, { prefix: '/api/v1' });

  // Health check
  server.get('/health', async () => ({ status: 'ok' }));

  try {
    const port = parseInt(config.PORT, 10);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server ready at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
