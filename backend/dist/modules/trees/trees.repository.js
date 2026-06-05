"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreesRepository = void 0;
const database_1 = require("../../core/database");
const database_utils_1 = require("../../core/database-utils");
const uuid_1 = require("uuid");
class TreesRepository {
    static async create(name, userId, userEmail, userName) {
        const session = (0, database_1.getSession)();
        const treeId = (0, uuid_1.v4)();
        const personId = (0, uuid_1.v4)();
        try {
            await session.run(`
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
        `, {
                treeId,
                name,
                userId,
                userEmail,
                personId,
                userName
            });
            return { id: treeId, name };
        }
        finally {
            await session.close();
        }
    }
    static async findByUserId(userId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`
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
        `, { userId });
            return result.records.map(r => ({
                ...(0, database_utils_1.normalizeNeo4jProperties)(r.get('t').properties),
                role: r.get('role'),
                status: r.get('status')
            }));
        }
        finally {
            await session.close();
        }
    }
    static async findById(treeId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (t:FamilyTree {id: $treeId})
         RETURN t`, { treeId });
            if (result.records.length === 0)
                return null;
            return (0, database_utils_1.normalizeNeo4jProperties)(result.records[0].get('t').properties);
        }
        finally {
            await session.close();
        }
    }
    static async getVisualData(treeId) {
        const session = (0, database_1.getSession)();
        try {
            const res = await session.run(`MATCH (p:Person {treeId: $treeId})
         WHERE p.deletedAt IS NULL
         OPTIONAL MATCH (p)-[r:FAMILY_RELATIONSHIP]-(n:Person)
         WHERE n.deletedAt IS NULL AND r.treeId = $treeId AND r.deletedAt IS NULL
         RETURN p, collect({rel: r, target: n, sourceId: id(startNode(r))}) as relationships`, { treeId });
            return res.records.map(r => {
                const pNode = r.get('p');
                const pProps = pNode.properties;
                const pInternalId = pNode.identity;
                const rawRels = r.get('relationships');
                const relationshipsMap = new Map();
                rawRels
                    .filter((item) => item.target !== null)
                    .forEach((item) => {
                    const relProps = item.rel.properties;
                    const targetProps = item.target.properties;
                    const sourceId = item.sourceId;
                    let type = relProps.type;
                    const isSource = sourceId.equals(pInternalId);
                    // Standardizing Directions:
                    // 'parent' edge: [Parent] -> [Child]
                    // If I am SOURCE of 'parent' edge -> target is my CHILD
                    // If I am TARGET of 'parent' edge -> source is my PARENT
                    if (type === 'parent' || type === 'adopted_child') {
                        type = isSource ? 'child' : 'parent';
                    }
                    else if (type === 'child') {
                        type = isSource ? 'parent' : 'child';
                    }
                    // 'spouse' and 'sibling' are symmetric
                    // Deduplicate: multiple edges might exist (though shouldn't)
                    relationshipsMap.set(`${type}-${targetProps.id}`, targetProps.id);
                });
                const relationships = Array.from(relationshipsMap.entries()).map(([key, targetId]) => ({
                    type: key.split('-')[0],
                    targetId
                }));
                return {
                    ...(0, database_utils_1.normalizeNeo4jProperties)(pProps),
                    relationships
                };
            });
        }
        finally {
            await session.close();
        }
    }
    static async getMembers(treeId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (u:User)-[r:MEMBER_OF]->(t:FamilyTree {id: $treeId})
         RETURN u, r.role as role, r.joinedAt as joinedAt
         ORDER BY u.name ASC`, { treeId });
            return result.records.map(r => ({
                ...r.get('u').properties,
                role: r.get('role'),
                joinedAt: r.get('joinedAt')
            }));
        }
        finally {
            await session.close();
        }
    }
    static async getAdmins(treeId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (u:User)-[:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId}) RETURN u.id as id`, { treeId });
            return result.records.map(r => r.get('id'));
        }
        finally {
            await session.close();
        }
    }
    static async isAdmin(treeId, userId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (u:User {id: $userId})-[r:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId}) RETURN r`, { userId, treeId });
            return result.records.length > 0;
        }
        finally {
            await session.close();
        }
    }
    static async getUserRole(treeId, userId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(t:FamilyTree {id: $treeId})
         RETURN r.role as role`, { userId, treeId });
            if (result.records.length === 0)
                return null;
            return result.records[0].get('role');
        }
        finally {
            await session.close();
        }
    }
}
exports.TreesRepository = TreesRepository;
