import { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; role?: string; email?: string };
  }
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
}

// Create a Supabase admin client if SERVICE_ROLE key provided
const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = serviceRoleKey && supabaseUrl ? createClient(supabaseUrl, serviceRoleKey) : null;

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', async (request, reply) => {
    const auth = request.headers.authorization;
    if (!auth) return; // allow unauthenticated for endpoints that don't require it

    console.log('[AUTH] Authorization header found:', auth.substring(0, 20) + '...');

    const parts = auth.split(' ');
    if (parts.length !== 2) {
      console.log('[AUTH] Invalid auth format, parts:', parts.length);
      return;
    }
    const token = parts[1];

    // Support a simple mock token format: MOCK:<userId>:<role>
    if (token.startsWith('MOCK:')) {
      const [, id, role] = token.split(':');
      request.user = { id, role: role || 'viewer' };
      console.log('[AUTH] Set user from MOCK token:', request.user);
      return;
    }

    // Decode JWT token to extract user info (Supabase tokens don't need verification server-side)
    try {
      // JWT format: header.payload.signature
      const jwtParts = token.split('.');
      console.log('[AUTH] JWT parts count:', jwtParts.length);
      
      if (jwtParts.length === 3) {
        // Decode the payload (second part)
        // JWT uses base64url encoding, need to convert back to standard base64
        let payload_b64 = jwtParts[1];
        // Add padding if needed
        payload_b64 += '='.repeat((4 - payload_b64.length % 4) % 4);
        
        const decoded = Buffer.from(payload_b64, 'base64').toString('utf8');
        const payload = JSON.parse(decoded) as any;
        console.log('[AUTH] Decoded JWT payload:', { sub: payload.sub, email: payload.email });
        
        if (payload && payload.sub) {
          request.user = { id: payload.sub, email: payload.email, role: payload.role || 'user' };
          console.log('[AUTH] User set from JWT:', request.user);
          return;
        } else {
          console.log('[AUTH] No sub in payload');
        }
      }
    } catch (err) {
      console.error('[AUTH] JWT decode failed:', err);
    }
  });

  // Add authenticate hook for routes that require auth
  fastify.decorate('authenticate', async function(request, reply) {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
  });
};

export default authPlugin;
