import fp from 'fastify-plugin';
import { supabaseAdmin } from '../core/supabase';
import { AppError } from '../core/errors';
import { FastifyRequest, FastifyReply } from 'fastify';

export default fp(async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.substring(7);
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      fastify.log.warn({ error }, '[AUTH] Supabase token validation failed');
      throw new AppError('Invalid or expired token', 401);
    }

    request.user = { id: user.id, email: user.email! };
  });
});
