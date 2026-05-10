import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../db';

// In-memory token store: token -> personId
const store = new Map<string, string>();

export default async function claimRoutes(fastify: FastifyInstance) {
  fastify.post('/claim-link/:personId', async (request, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });

    const { personId } = request.params as any;
    const token = uuidv4();
    store.set(token, personId);
    // In a real app you'd email or return a link. We'll return token for simplicity.
    return { token, personId };
  });

  fastify.post('/claim', async (request, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });
    const body = request.body as any;
    const token = body.token;
    if (!token) return reply.status(400).send({ error: 'Missing token' });
    const personId = store.get(token);
    if (!personId) return reply.status(400).send({ error: 'Invalid or expired token' });

    const session = getSession();
    try {
      await session.run(
        `MERGE (u:User {id:$userId})
         WITH u
         MATCH (p:Person {id:$personId})
         MERGE (u)-[:CAN_EDIT]->(p)`,
        { userId: user.id, personId }
      );
      store.delete(token);
      return { success: true, personId };
    } finally {
      await session.close();
    }
  });
}
