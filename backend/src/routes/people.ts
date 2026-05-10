import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../db';

export default async function peopleRoutes(fastify: FastifyInstance) {
  fastify.post('/people', async (request, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });

    const body = request.body as any;
    const id = uuidv4();
    const name = body.name;
    const dob = body.dob || null;
    const dod = body.dod || null;

    const session = getSession();
    try {
      await session.run(
        'CREATE (p:Person {id:$id, name:$name, dob:$dob, dod:$dod, createdBy:$createdBy}) RETURN p',
        { id, name, dob, dod, createdBy: user.id }
      );
      return { id, name, dob, dod, createdBy: user.id };
    } finally {
      await session.close();
    }
  });

  fastify.get('/people', async (request, reply) => {
    const session = getSession();
    try {
      const res = await session.run('MATCH (p:Person) RETURN p LIMIT 100');
      const people = res.records.map(r => r.get('p').properties);
      return people;
    } finally {
      await session.close();
    }
  });

  fastify.get('/people/:id', async (request, reply) => {
    const { id } = request.params as any;
    const session = getSession();
    try {
      const res = await session.run('MATCH (p:Person {id:$id}) RETURN p', { id });
      if (res.records.length === 0) return reply.status(404).send({ error: 'Not found' });
      const p = res.records[0].get('p').properties;
      return p;
    } finally {
      await session.close();
    }
  });

  fastify.put('/people/:id', async (request, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });
    const { id } = request.params as any;
    const body = request.body as any;

    const session = getSession();
    try {
      // Check permission: admin OR createdBy=user.id OR user has CAN_EDIT
      const perm = await session.run(
        `MATCH (p:Person {id:$id})
         OPTIONAL MATCH (u:User {id:$userId})-[r:CAN_EDIT]->(p)
         RETURN p.createdBy AS createdBy, count(r) AS canEditCount`,
        { id, userId: user.id }
      );

      if (perm.records.length === 0) return reply.status(404).send({ error: 'Not found' });
      const createdBy = perm.records[0].get('createdBy');
      const canEditCount = perm.records[0].get('canEditCount').toNumber ? perm.records[0].get('canEditCount').toNumber() : perm.records[0].get('canEditCount');

      const allowed = user.role === 'admin' || createdBy === user.id || canEditCount > 0;
      if (!allowed) return reply.status(403).send({ error: 'Forbidden' });

      const params: any = { id };
      const setters: string[] = [];
      if (body.name !== undefined) { setters.push('p.name = $name'); params.name = body.name; }
      if (body.dob !== undefined) { setters.push('p.dob = $dob'); params.dob = body.dob; }
      if (body.dod !== undefined) { setters.push('p.dod = $dod'); params.dod = body.dod; }

      if (setters.length === 0) return reply.status(400).send({ error: 'No fields to update' });

      const query = `MATCH (p:Person {id:$id}) SET ${setters.join(', ')} RETURN p`;
      const r = await session.run(query, params);
      return r.records[0].get('p').properties;
    } finally {
      await session.close();
    }
  });

  fastify.delete('/people/:id', async (request, reply) => {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: 'Authentication required' });
    if (user.role !== 'admin') return reply.status(403).send({ error: 'Admin only' });
    const { id } = request.params as any;
    const session = getSession();
    try {
      await session.run('MATCH (p:Person {id:$id}) DETACH DELETE p', { id });
      return { success: true };
    } finally {
      await session.close();
    }
  });
}
