import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../core/database';
import { AppError } from '../core/errors';
import { verifyTreeAccess } from '../middleware/tree-auth';
import { createTreeSchema } from '../shared/schemas/trees';
import { AuditService } from '../modules/audit/audit.service';

const normalizeNeo4jProperties = (props: Record<string, any>) => {
  const normalized: Record<string, any> = {};

  Object.entries(props).forEach(([key, value]) => {
    normalized[key] =
      typeof value === 'object' && value !== null && typeof value.toNumber === 'function'
        ? value.toNumber()
        : value;
  });

  return normalized;
};

export default async function treeRoutes(fastify: FastifyInstance) {
  
  /**
   * Create a new family tree
   */
  fastify.post('/trees', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name } = createTreeSchema.parse(request.body);
    const user = request.user!;

    const treeId = uuidv4();
    const personId = uuidv4(); // Create a person node for the admin
    const session = getSession();

    try {
      // Use MERGE for User to ensure it exists before creating relationships
      // This prevents "orphaned" trees that are created but not linked to a user.
      await session.run(
        `
        MERGE (u:User {id: $userId})
        ON CREATE SET u.email = $userEmail, u.createdAt = timestamp()
        
        CREATE (t:FamilyTree {
          id: $treeId,
          name: $name,
          createdBy: $userId,
          createdAt: timestamp()
        })
        CREATE (u)-[:MEMBER_OF {role: 'admin', joinedAt: timestamp()}]->(t)
        
        CREATE (p:Person {
          id: $personId,
          treeId: $treeId,
          firstName: $userName,
          status: 'active',
          createdBy: $userId,
          createdAt: timestamp()
        })
        CREATE (p)-[:BELONGS_TO_TREE]->(t)
        CREATE (u)-[:REPRESENTS]->(p)
        RETURN t
        `,
        { 
          treeId, 
          name, 
          userId: user.id, 
          userEmail: user.email,
          personId,
          userName: user.email?.split('@')[0] || 'Admin'
        }
      );

      return { 
        success: true, 
        data: { id: treeId, name } 
      };
    } finally {
      await session.close();
    }
  });

  /**
   * Get all trees the user is a member of (including pending requests)
   */
  fastify.get('/trees', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user!;
    const session = getSession();

    try {
      const result = await session.run(
        `
        MATCH (u:User {id: $userId})
        OPTIONAL MATCH (u)-[m:MEMBER_OF]->(t1:FamilyTree)
        OPTIONAL MATCH (u)-[:HAS_ACCESS_REQUEST]->(ar:TreeAccessRequest {status: 'pending'})-[:REQUESTS_ACCESS_TO]->(t2:FamilyTree)
        WITH 
          collect({tree: t1, role: m.role, status: 'active'}) + 
          collect({tree: t2, role: ar.requestedRole, status: 'pending'}) as entries
        UNWIND entries as entry
        WITH entry WHERE entry.tree IS NOT NULL
        RETURN entry.tree as t, entry.role as role, entry.status as status
        ORDER BY t.createdAt DESC
        `,
        { userId: user.id }
      );

      const trees = result.records.map(r => ({
        ...normalizeNeo4jProperties(r.get('t').properties),
        role: r.get('role'),
        status: r.get('status')
      }));

      return { success: true, data: trees };
    } finally {
      await session.close();
    }
  });

  /**
   * Get specific tree details
   */
  fastify.get('/trees/:treeId', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId } = request.params as { treeId: string };
    const user = request.user!;
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (t:FamilyTree {id: $treeId})
         RETURN t`,
        { treeId }
      );

      if (result.records.length === 0) {
        throw new AppError('Tree not found', 404);
      }

      return { 
        success: true, 
        data: {
          ...normalizeNeo4jProperties(result.records[0].get('t').properties),
          role: request.treeRole // From verifyTreeAccess
        }
      };
    } finally {
      await session.close();
    }
  });

  /**
   * Visual Tree Data
   */
  fastify.get('/trees/:treeId/visual', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId } = request.params as { treeId: string };
    const session = getSession();

    try {
      const res = await session.run(
        `MATCH (p:Person {treeId: $treeId})
         WHERE p.deletedAt IS NULL
         OPTIONAL MATCH (p)-[r:FAMILY_RELATIONSHIP]-(n:Person)
         WHERE n.deletedAt IS NULL AND r.treeId = $treeId
         RETURN p, collect({rel: r, target: n, isSource: (startNode(r) = p)}) as relationships`,
        { treeId }
      );

      const people = res.records.map(r => {
        const pProps = r.get('p').properties;
        const rawRels = r.get('relationships');
        
        const relationships = rawRels
          .filter((item: any) => item.target !== null)
          .map((item: any) => {
            const relProps = item.rel.properties;
            const targetProps = item.target.properties;
            const isSource = item.isSource;
            
            let type = relProps.type;
            
            // If we are at the target node of a hierarchical relationship, we show the inverse type
            if (!isSource) {
              if (type === 'parent') type = 'child';
              else if (type === 'child') type = 'parent';
              else if (type === 'adopted_child') type = 'parent';
            }
            
            return {
              type,
              targetId: targetProps.id
            };
          });

        return {
          ...normalizeNeo4jProperties(pProps),
          relationships
        };
      });

      return { success: true, data: people };
    } finally {
      await session.close();
    }
  });

  /**
   * Get all members (users) of a tree
   */
  fastify.get('/trees/:treeId/members', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId } = request.params as { treeId: string };
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (u:User)-[r:MEMBER_OF]->(t:FamilyTree {id: $treeId})
         RETURN u, r.role as role, r.joinedAt as joinedAt
         ORDER BY u.name ASC`,
        { treeId }
      );

      const members = result.records.map(r => ({
        ...r.get('u').properties,
        role: r.get('role'),
        joinedAt: r.get('joinedAt')
      }));

      return { success: true, data: members };
    } finally {
      await session.close();
    }
  });

  /**
   * Get tree activity logs
   */
  fastify.get('/trees/:treeId/activity', { 
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin', 'member', 'viewer'])] 
  }, async (request, reply) => {
    const { treeId } = request.params as { treeId: string };
    const { limit } = request.query as { limit?: string };
    
    const logs = await AuditService.getTreeLogs(treeId, limit ? parseInt(limit, 10) : 50);
    return { success: true, data: logs };
  });
}
