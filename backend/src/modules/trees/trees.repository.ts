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
        WHERE t1.deletedAt IS NULL
        OPTIONAL MATCH (u)-[:HAS_ACCESS_REQUEST]->(ar:TreeAccessRequest {status: 'pending'})-[:REQUESTS_ACCESS_TO]->(t2:FamilyTree)
        WHERE t2.deletedAt IS NULL
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

  static async getVisualData(treeId: string, userId: string) {
    const session = getSession();
    try {
      const res = await session.run(
        `MATCH (p:Person {treeId: $treeId})
         WHERE p.deletedAt IS NULL
         
         // Calculate Permission for current user
         OPTIONAL MATCH (u:User {id: $userId})
         OPTIONAL MATCH (u)-[tr:MEMBER_OF]->(t:FamilyTree {id: $treeId})
         OPTIONAL MATCH (u)-[pr:HAS_PERMISSION]->(p)
         
         WITH p, tr, pr, u
         
         // Permission Logic
         // 1. Tree Admin or Person Creator or Profile Owner = 'owner'
         // 2. Explicit 'editor' permission = 'editor'
         // 3. Tree Member = 'viewer'
         // 4. Otherwise null (shouldn't happen due to tree isolation)
         
         WITH p, 
              CASE 
                WHEN tr.role = 'admin' OR p.createdBy = $userId OR pr.permission = 'owner' THEN 'owner'
                WHEN pr.permission = 'editor' THEN 'editor'
                WHEN tr.role IS NOT NULL THEN 'viewer'
                ELSE null 
              END as userPermission
         
         OPTIONAL MATCH (p)-[r:FAMILY_RELATIONSHIP]-(n:Person)
         WHERE n.deletedAt IS NULL AND r.treeId = $treeId AND r.deletedAt IS NULL
         RETURN p, userPermission, collect({rel: r, target: n, sourceId: id(startNode(r))}) as relationships`,
        { treeId, userId }
      );

      return res.records.map(r => {
        const pNode = r.get('p');
        const pProps = pNode.properties;
        const pInternalId = pNode.identity;
        const userPermission = r.get('userPermission');
        const rawRels = r.get('relationships');
        
        const relationshipsMap = new Map<string, string>();
        
        rawRels
          .filter((item: any) => item.target !== null)
          .forEach((item: any) => {
            const relProps = item.rel.properties;
            const targetProps = item.target.properties;
            const sourceId = item.sourceId;
            
            let type = relProps.type;
            const isSource = sourceId.equals(pInternalId);
            
            if (type === 'parent' || type === 'adopted_child') {
              type = isSource ? 'child' : 'parent';
            } else if (type === 'child') {
              type = isSource ? 'parent' : 'child';
            }
            
            relationshipsMap.set(`${type}-${targetProps.id}`, targetProps.id);
          });

        const relationships = Array.from(relationshipsMap.entries()).map(([key, targetId]) => ({
          type: key.split('-')[0],
          targetId
        }));

        return {
          ...normalizeNeo4jProperties(pProps),
          userPermission,
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

  static async renameTree(treeId: string, name: string) {
    const session = getSession();
    try {
      await session.run(
        `MATCH (t:FamilyTree {id: $treeId}) SET t.name = $name RETURN t`,
        { treeId, name }
      );
    } finally {
      await session.close();
    }
  }

  static async deleteTree(treeId: string) {
    const session = getSession();
    try {
      // Soft delete: set deletedAt timestamp on the tree and all its components
      await session.run(
        `MATCH (t:FamilyTree {id: $treeId}) 
         SET t.deletedAt = timestamp()
         WITH t
         MATCH (t)<-[:BELONGS_TO_TREE]-(p:Person)
         SET p.deletedAt = timestamp()`,
        { treeId }
      );
    } finally {
      await session.close();
    }
  }
}
