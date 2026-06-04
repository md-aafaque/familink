import { getSession } from '../../core/database';
import { normalizeNeo4jProperties } from '../../core/database-utils';
import { v4 as uuidv4 } from 'uuid';

export class TreesRepository {
  static async create(name: string, userId: string, userEmail: string, userName: string) {
    const session = getSession();
    const treeId = uuidv4();
    const personId = uuidv4();
    try {
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
          userId, 
          userEmail,
          personId,
          userName
        }
      );
      return { id: treeId, name };
    } finally {
      await session.close();
    }
  }

  static async findByUserId(userId: string) {
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
        { userId }
      );

      return result.records.map(r => ({
        ...normalizeNeo4jProperties(r.get('t').properties),
        role: r.get('role'),
        status: r.get('status')
      }));
    } finally {
      await session.close();
    }
  }

  static async findById(treeId: string) {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (t:FamilyTree {id: $treeId})
         RETURN t`,
        { treeId }
      );

      if (result.records.length === 0) return null;
      return normalizeNeo4jProperties(result.records[0].get('t').properties);
    } finally {
      await session.close();
    }
  }

  static async getVisualData(treeId: string) {
    const session = getSession();
    try {
      const res = await session.run(
        `MATCH (p:Person {treeId: $treeId})
         WHERE p.deletedAt IS NULL
         OPTIONAL MATCH (p)-[r:FAMILY_RELATIONSHIP]-(n:Person)
         WHERE n.deletedAt IS NULL AND r.treeId = $treeId AND r.deletedAt IS NULL
         RETURN p, collect({rel: r, target: n, isSource: (startNode(r) = p)}) as relationships`,
        { treeId }
      );

      return res.records.map(r => {
        const pProps = r.get('p').properties;
        const rawRels = r.get('relationships');
        
        const relationships = rawRels
          .filter((item: any) => item.target !== null)
          .map((item: any) => {
            const relProps = item.rel.properties;
            const targetProps = item.target.properties;
            const isSource = item.isSource;
            
            let type = relProps.type;
            
            if (isSource) {
              if (type === 'parent') type = 'child';
              else if (type === 'child') type = 'parent';
              else if (type === 'adopted_child') type = 'child';
            } else {
              if (type === 'parent') type = 'parent';
              else if (type === 'child') type = 'child';
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
    } finally {
      await session.close();
    }
  }

  static async getMembers(treeId: string) {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (u:User)-[r:MEMBER_OF]->(t:FamilyTree {id: $treeId})
         RETURN u, r.role as role, r.joinedAt as joinedAt
         ORDER BY u.name ASC`,
        { treeId }
      );

      return result.records.map(r => ({
        ...r.get('u').properties,
        role: r.get('role'),
        joinedAt: r.get('joinedAt')
      }));
    } finally {
      await session.close();
    }
  }

  static async getAdmins(treeId: string) {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (u:User)-[:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId}) RETURN u.id as id`,
        { treeId }
      );
      return result.records.map(r => r.get('id'));
    } finally {
      await session.close();
    }
  }

  static async isAdmin(treeId: string, userId: string) {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[r:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId}) RETURN r`,
        { userId, treeId }
      );
      return result.records.length > 0;
    } finally {
      await session.close();
    }
  }

  static async getUserRole(treeId: string, userId: string): Promise<string | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(t:FamilyTree {id: $treeId})
         RETURN r.role as role`,
        { userId, treeId }
      );

      if (result.records.length === 0) return null;
      return result.records[0].get('role');
    } finally {
      await session.close();
    }
  }
}
