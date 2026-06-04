import type { FastifyReply, FastifyRequest } from 'fastify';
import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name: string;
      role?: string;
    };
    treeRole?: string;
  }
}
