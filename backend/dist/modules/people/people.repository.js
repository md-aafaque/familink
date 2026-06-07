"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeopleRepository = void 0;
const database_1 = require("../../core/database");
const uuid_1 = require("uuid");
const errors_1 = require("../../core/errors");
class PeopleRepository {
    static async create(input) {
        const session = (0, database_1.getSession)();
        try {
            const id = (0, uuid_1.v4)();
            const result = await session.run(`
        MATCH (t:FamilyTree {id: $treeId})
        CREATE (p:Person {
          id: $id,
          treeId: $treeId,
          firstName: $firstName,
          lastName: $lastName,
          gender: $gender,
          birthDate: $birthDate,
          deathDate: $deathDate,
          status: $status,
          phone: $phone,
          phoneVisibility: $phoneVisibility,
          email: $email,
          emailVisibility: $emailVisibility,
          address: $address,
          addressVisibility: $addressVisibility,
          birthDateVisibility: $birthDateVisibility,
          createdBy: $createdBy,
          createdAt: timestamp()
        })
        CREATE (p)-[:BELONGS_TO_TREE]->(t)
        RETURN p
        `, { ...input, id });
            return result.records[0].get('p').properties;
        }
        finally {
            await session.close();
        }
    }
    static async findById(id, treeId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (p:Person {id: $id, treeId: $treeId}) WHERE p.deletedAt IS NULL RETURN p`, { id, treeId });
            if (result.records.length === 0)
                return null;
            return result.records[0].get('p').properties;
        }
        finally {
            await session.close();
        }
    }
    /**
     * Internal use only for discovery when treeId is unknown.
     * e.g. during initial claim request.
     */
    static async findByIdGlobal(id) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (p:Person {id: $id}) WHERE p.deletedAt IS NULL RETURN p`, { id });
            if (result.records.length === 0)
                return null;
            return result.records[0].get('p').properties;
        }
        finally {
            await session.close();
        }
    }
    static async update(id, treeId, input) {
        const keys = Object.keys(input);
        if (keys.length === 0) {
            const existing = await this.findById(id, treeId);
            if (!existing)
                throw new errors_1.AppError('Person not found', 404);
            return existing;
        }
        const session = (0, database_1.getSession)();
        try {
            // Build the SET clause dynamically but safely using parameters
            const setters = keys
                .map(key => `p.${key} = $${key}`)
                .join(', ');
            const result = await session.run(`MATCH (p:Person {id: $id, treeId: $treeId}) 
         WHERE p.deletedAt IS NULL
         SET ${setters} 
         RETURN p`, { ...input, id, treeId });
            if (result.records.length === 0) {
                throw new errors_1.AppError('Person not found or already deleted', 404);
            }
            return result.records[0].get('p').properties;
        }
        finally {
            await session.close();
        }
    }
    static async softDelete(id, treeId, deletedBy) {
        const session = (0, database_1.getSession)();
        try {
            await session.run(`MATCH (p:Person {id: $id, treeId: $treeId}) SET p.deletedAt = timestamp(), p.deletedBy = $deletedBy`, { id, treeId, deletedBy });
        }
        finally {
            await session.close();
        }
    }
    static async checkPermission(personId, userId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`
        MATCH (u:User {id: $userId})
        MATCH (p:Person {id: $personId})
        OPTIONAL MATCH (u)-[r:MEMBER_OF]->(t:FamilyTree {id: p.treeId})
        OPTIONAL MATCH (u)-[prm:HAS_PERMISSION]->(p)
        RETURN r.role as treeRole, prm.permission as explicitPermission, p.createdBy as creatorId
        `, { userId, personId });
            if (result.records.length === 0)
                return null;
            const rec = result.records[0];
            const treeRole = rec.get('treeRole');
            const explicitPermission = rec.get('explicitPermission');
            const creatorId = rec.get('creatorId');
            if (treeRole === 'admin' || creatorId === userId || explicitPermission === 'owner')
                return 'owner';
            if (explicitPermission === 'editor')
                return 'editor';
            if (treeRole)
                return 'viewer';
            return null;
        }
        finally {
            await session.close();
        }
    }
    static async createClaimRequest(personId, userId, treeId) {
        const session = (0, database_1.getSession)();
        try {
            const id = (0, uuid_1.v4)();
            await session.run(`
        MATCH (p:Person {id: $personId, treeId: $treeId})
        MATCH (u:User {id: $userId})
        CREATE (cr:ClaimRequest {
          id: $id,
          personId: $personId,
          userId: $userId,
          treeId: $treeId,
          status: 'pending',
          createdAt: timestamp()
        })
        CREATE (cr)-[:REQUESTS_CLAIM_ON]->(p)
        CREATE (u)-[:INITIATED_CLAIM]->(cr)
        `, { id, personId, userId, treeId });
        }
        finally {
            await session.close();
        }
    }
    static async findClaimRequestById(id) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (cr:ClaimRequest {id: $id}) RETURN cr`, { id });
            if (result.records.length === 0)
                return null;
            return result.records[0].get('cr').properties;
        }
        finally {
            await session.close();
        }
    }
    static async updateClaimRequestStatus(id, status) {
        const session = (0, database_1.getSession)();
        try {
            await session.run(`MATCH (cr:ClaimRequest {id: $id}) SET cr.status = $status, cr.processedAt = timestamp()`, { id, status });
        }
        finally {
            await session.close();
        }
    }
    static async getPendingClaimRequests(treeId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`
        MATCH (cr:ClaimRequest {treeId: $treeId, status: 'pending'})
        MATCH (p:Person {id: cr.personId})
        MATCH (u:User {id: cr.userId})
        RETURN cr, p, u.email as email, u.name as name
        ORDER BY cr.createdAt DESC
        `, { treeId });
            return result.records.map(r => ({
                ...r.get('cr').properties,
                person: r.get('p').properties,
                userEmail: r.get('email'),
                userName: r.get('name')
            }));
        }
        finally {
            await session.close();
        }
    }
    static async mergePeople(sourceId, targetId, treeId, userId) {
        const session = (0, database_1.getSession)();
        try {
            await session.run(`
        MATCH (s:Person {id: $sourceId, treeId: $treeId})
        MATCH (t:Person {id: $targetId, treeId: $treeId})
        
        // 1. Move outgoing relationships
        WITH s, t
        MATCH (s)-[r:FAMILY_RELATIONSHIP]->(other:Person)
        WHERE other.id <> $targetId AND r.deletedAt IS NULL
        MERGE (t)-[newR:FAMILY_RELATIONSHIP {type: r.type, treeId: $treeId}]->(other)
        ON CREATE SET newR.createdBy = r.createdBy, 
                      newR.createdAt = r.createdAt, 
                      newR.approvedBy = r.approvedBy
        SET r.deletedAt = timestamp(), r.deletedBy = $userId, r.mergeTargetId = $targetId

        WITH s, t
        // 2. Move incoming relationships
        MATCH (other:Person)-[r:FAMILY_RELATIONSHIP]->(s)
        WHERE other.id <> $targetId AND r.deletedAt IS NULL
        MERGE (other)-[newR:FAMILY_RELATIONSHIP {type: r.type, treeId: $treeId}]->(t)
        ON CREATE SET newR.createdBy = r.createdBy, 
                      newR.createdAt = r.createdAt, 
                      newR.approvedBy = r.approvedBy
        SET r.deletedAt = timestamp(), r.deletedBy = $userId, r.mergeTargetId = $targetId

        WITH s, t
        // 3. Mark source as merged
        SET s.status = 'merged', s.mergedIntoId = $targetId, s.deletedAt = timestamp(), s.deletedBy = $userId
        `, { sourceId, targetId, treeId, userId });
        }
        finally {
            await session.close();
        }
    }
    static async grantPermission(personId, userId, permission) {
        const session = (0, database_1.getSession)();
        try {
            await session.run(`
        MATCH (p:Person {id: $personId})
        MATCH (u:User {id: $userId})
        MERGE (u)-[r:HAS_PERMISSION]->(p)
        SET r.permission = $permission, r.updatedAt = timestamp()
        `, { personId, userId, permission });
        }
        finally {
            await session.close();
        }
    }
    static async revokePermission(personId, userId) {
        const session = (0, database_1.getSession)();
        try {
            await session.run(`
        MATCH (u:User {id: $userId})-[r:HAS_PERMISSION]->(p:Person {id: $personId})
        DELETE r
        `, { personId, userId });
        }
        finally {
            await session.close();
        }
    }
    static async getPermissions(personId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`
        MATCH (u:User)-[r:HAS_PERMISSION]->(p:Person {id: $personId})
        RETURN u.id as userId, u.name as name, u.email as email, r.permission as permission
        `, { personId });
            return result.records.map(r => ({
                userId: r.get('userId'),
                name: r.get('name'),
                email: r.get('email'),
                permission: r.get('permission')
            }));
        }
        finally {
            await session.close();
        }
    }
    static async listPeople(treeId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (p:Person {treeId: $treeId})
         WHERE p.deletedAt IS NULL
         OPTIONAL MATCH (p)-[r:FAMILY_RELATIONSHIP]-()
         RETURN p, count(r) as relCount
         ORDER BY p.firstName ASC`, { treeId });
            return result.records.map(r => ({
                ...r.get('p').properties,
                relationshipCount: r.get('relCount').toNumber()
            }));
        }
        finally {
            await session.close();
        }
    }
    static async getNeighborhood(treeId, userId) {
        const session = (0, database_1.getSession)();
        try {
            // 1. Find the person represented by this user in this tree
            const meResult = await session.run(`MATCH (u:User {id: $userId})-[:REPRESENTS]->(p:Person {treeId: $treeId}) RETURN p`, { userId, treeId });
            let rootPerson;
            if (meResult.records.length === 0) {
                // If not representing anyone, just pick the first person or a root
                const anyResult = await session.run(`MATCH (p:Person {treeId: $treeId}) RETURN p LIMIT 1`, { treeId });
                if (anyResult.records.length === 0)
                    return null;
                rootPerson = anyResult.records[0].get('p').properties;
            }
            else {
                rootPerson = meResult.records[0].get('p').properties;
            }
            // 2. Get direct relations (level 1)
            const l1Result = await session.run(`MATCH (p:Person {id: $id})-[r:FAMILY_RELATIONSHIP]-(n:Person)
         RETURN DISTINCT n`, { id: rootPerson.id });
            const level1 = l1Result.records.map(r => r.get('n').properties);
            // 3. Get extended relations (level 2)
            const l1Ids = level1.map((p) => p.id).concat([rootPerson.id]);
            const l2Result = await session.run(`MATCH (p:Person {id: $id})-[:FAMILY_RELATIONSHIP]-(n:Person)-[:FAMILY_RELATIONSHIP]-(m:Person)
         WHERE NOT m.id IN $l1Ids
         RETURN DISTINCT m`, { id: rootPerson.id, l1Ids });
            const level2 = l2Result.records.map(r => r.get('m').properties);
            return {
                person: rootPerson,
                level1,
                level2
            };
        }
        finally {
            await session.close();
        }
    }
    static async linkUserToPerson(userId, personId, treeId) {
        const session = (0, database_1.getSession)();
        try {
            // 1. Check if user already represents someone in this tree
            const existing = await session.run(`MATCH (u:User {id: $userId})-[:REPRESENTS]->(p:Person {treeId: $treeId}) RETURN p`, { userId, treeId });
            if (existing.records.length > 0) {
                const currentPerson = existing.records[0].get('p').properties;
                await session.run(`
          MATCH (u:User {id: $userId})-[oldRel:REPRESENTS]->(pOld:Person {id: $oldId})
          MATCH (pNew:Person {id: $newId})
          DELETE oldRel
          CREATE (u)-[:REPRESENTS]->(pNew)
          SET pNew.status = 'active', pNew.accountId = $userId
          `, { userId, oldId: currentPerson.id, newId: personId });
            }
            else {
                await session.run(`
          MATCH (u:User {id: $userId}), (p:Person {id: $personId})
          CREATE (u)-[:REPRESENTS]->(p)
          SET p.status = 'active', p.accountId = $userId
          `, { userId, personId });
            }
        }
        finally {
            await session.close();
        }
    }
}
exports.PeopleRepository = PeopleRepository;
