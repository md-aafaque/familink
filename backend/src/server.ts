import Fastify from 'fastify';
import dotenv from 'dotenv';
import routes from './routes';
import authPlugin from './plugins/auth';
import cors from '@fastify/cors';

dotenv.config();

const server = Fastify({ logger: true });

async function start() {
  await server.register(cors, { origin: ['http://localhost:3000'] });
  
  // Register auth plugin first
  await server.register(authPlugin);
  
  // Add global preHandler hook that applies to ALL routes including prefixed ones
  server.addHook('preHandler', async (request, reply) => {
    const auth = request.headers.authorization;
    
    if (!auth) {
      return;
    }

    console.log('[AUTH-GLOBAL] Authorization header present');

    const parts = auth.split(' ');
    if (parts.length !== 2) {
      console.log('[AUTH-GLOBAL] Invalid auth format');
      return;
    }

    const token = parts[1];
    
    // Support a simple mock token format: MOCK:<userId>:<role>
    if (token.startsWith('MOCK:')) {
      const [, id, role] = token.split(':');
      request.user = { id, role: role || 'viewer' };
      console.log('[AUTH-GLOBAL] MOCK token user:', request.user);
      return;
    }

    // Decode JWT token to extract user info
    try {
      const jwtParts = token.split('.');
      
      if (jwtParts.length === 3) {
        let payload_b64 = jwtParts[1];
        payload_b64 += '='.repeat((4 - payload_b64.length % 4) % 4);
        
        const decoded = Buffer.from(payload_b64, 'base64').toString('utf8');
        const payload = JSON.parse(decoded) as any;
        
        const userId = payload.sub || payload.user_id;
        if (userId) {
          request.user = { id: userId, email: payload.email, role: payload.role || 'user' };
          console.log('[AUTH-GLOBAL] JWT user extracted:', request.user);
          return;
        } else {
          console.log('[AUTH-GLOBAL] No sub/user_id in JWT payload');
        }
      }
    } catch (err) {
      console.error('[AUTH-GLOBAL] JWT decode failed:', err);
    }
  });
  
  await server.register(routes, { prefix: '/api' });


  const port = Number(process.env.PORT || 3001);
  try {
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
