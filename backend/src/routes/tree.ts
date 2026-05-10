import { FastifyInstance } from 'fastify';
import { getSession } from '../db';

export default async function treeRoutes(fastify: FastifyInstance) {
  fastify.get('/people/:id/tree', async (request, reply) => {
    const { id } = request.params as any;
    const session = getSession();
    try {
      // Return the person and immediate relationships (only approved) up to depth 2
      const res = await session.run(
        `MATCH (p:Person {id:$id})
         OPTIONAL MATCH (p)-[r1 {status: 'approved'}]-(n1:Person)
         OPTIONAL MATCH (n1)-[r2 {status: 'approved'}]-(n2:Person)
         RETURN p, collect(DISTINCT n1) AS level1, collect(DISTINCT n2) AS level2, collect(DISTINCT r1) AS rel1, collect(DISTINCT r2) AS rel2`,
        { id }
      );
      if (res.records.length === 0) return reply.status(404).send({ error: 'Not found' });
      const rec = res.records[0];
      const person = rec.get('p').properties;
      const level1 = (rec.get('level1') || []).map((n: any) => n.properties);
      const level2 = (rec.get('level2') || []).map((n: any) => n.properties);
      return { person, level1, level2 };
    } finally {
      await session.close();
    }
  });
}
