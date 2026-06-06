"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipRepository = void 0;
const database_1 = require("../../core/database");
const uuid_1 = require("uuid");
const errors_1 = require("../../core/errors");
const database_utils_1 = require("../../core/database-utils");
class RelationshipRepository {
    static async createProposal(input) {
        const session = (0, database_1.getSession)();
        try {
            const id = (0, uuid_1.v4)();
            const result = await session.run(`
        CREATE (rp:RelationshipProposal {
          id: $id,
          treeId: $treeId,
          proposerId: $proposerId,
          fromPersonId: $fromPersonId,
          toPersonId: $toPersonId,
          relationshipType: $relationshipType,
          status: 'pending',
          createdAt: timestamp()
        })
        RETURN rp
        `, { ...input, id });
            return result.records[0].get('rp').properties;
        }
        finally {
            await session.close();
        }
    }
    static async findProposalById(id) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`MATCH (rp:RelationshipProposal {id: $id}) RETURN rp`, { id });
            if (result.records.length === 0)
                return null;
            return result.records[0].get('rp').properties;
        }
        finally {
            await session.close();
        }
    }
    static async updateProposalStatus(id, status, rejectionReason) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`
        MATCH (rp:RelationshipProposal {id: $id})
        SET rp.status = $status,
            rp.rejectionReason = $rejectionReason,
            rp.processedAt = timestamp()
        RETURN rp
        `, { id, status, rejectionReason: rejectionReason || null });
            if (result.records.length === 0) {
                throw new errors_1.AppError('Proposal not found', 404);
            }
        }
        finally {
            await session.close();
        }
    }
    static async createOfficialRelationship(treeId, fromId, toId, type, createdBy, approvedBy) {
        const session = (0, database_1.getSession)();
        try {
            const reciprocalMap = {
                'parent': 'child',
                'child': 'parent',
                'spouse': 'spouse',
                'sibling': 'sibling',
                'adopted_child': 'parent'
            };
            const reciprocalType = reciprocalMap[type] || type;
            // 1. Create primary relationship
            const res1 = await session.run(`
        MATCH (a:Person {id: $fromId, treeId: $treeId}), (b:Person {id: $toId, treeId: $treeId})
        MERGE (a)-[r:FAMILY_RELATIONSHIP {type: $type, treeId: $treeId}]->(b)
        ON CREATE SET r.createdBy = $createdBy, 
                      r.approvedBy = $approvedBy, 
                      r.createdAt = timestamp()
        RETURN r
        `, { fromId, toId, type, treeId, createdBy, approvedBy });
            if (res1.records.length === 0) {
                throw new errors_1.AppError('Failed to create relationship: One or both people not found', 404);
            }
            // 2. Create reciprocal relationship
            await session.run(`
        MATCH (a:Person {id: $fromId, treeId: $treeId}), (b:Person {id: $toId, treeId: $treeId})
        MERGE (b)-[r:FAMILY_RELATIONSHIP {type: $reciprocalType, treeId: $treeId}]->(a)
        ON CREATE SET r.createdBy = $createdBy, 
                      r.approvedBy = $approvedBy, 
                      r.createdAt = timestamp()
        `, { fromId, toId, reciprocalType, treeId, createdBy, approvedBy });
            // 3. Sibling Parent Inference
            if (type === 'sibling') {
                await session.run(`
          MATCH (a:Person {id: $fromId, treeId: $treeId}), (b:Person {id: $toId, treeId: $treeId})
          
          // Parents of A -> become parents of B
          OPTIONAL MATCH (pA:Person)-[:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(a)
          WHERE pA.deletedAt IS NULL
          WITH a, b, collect(pA) as parentsA
          UNWIND (CASE WHEN size(parentsA) > 0 THEN parentsA ELSE [null] END) as p1
          WITH a, b, p1 WHERE p1 IS NOT NULL
          MERGE (p1)-[r1:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(b)
          ON CREATE SET r1.createdBy = $createdBy, r1.approvedBy = $approvedBy, r1.createdAt = timestamp()
          MERGE (b)-[r2:FAMILY_RELATIONSHIP {type: 'child', treeId: $treeId}]->(p1)
          ON CREATE SET r2.createdBy = $createdBy, r2.approvedBy = $approvedBy, r2.createdAt = timestamp()
          
          WITH DISTINCT a, b
          
          // Parents of B -> become parents of A
          OPTIONAL MATCH (pB:Person)-[:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(b)
          WHERE pB.deletedAt IS NULL
          WITH a, b, collect(pB) as parentsB
          UNWIND (CASE WHEN size(parentsB) > 0 THEN parentsB ELSE [null] END) as p2
          WITH a, b, p2 WHERE p2 IS NOT NULL
          MERGE (p2)-[r3:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(a)
          ON CREATE SET r3.createdBy = $createdBy, r3.approvedBy = $approvedBy, r3.createdAt = timestamp()
          MERGE (a)-[r4:FAMILY_RELATIONSHIP {type: 'child', treeId: $treeId}]->(p2)
          ON CREATE SET r4.createdBy = $createdBy, r4.approvedBy = $approvedBy, r4.createdAt = timestamp()
          `, { fromId, toId, treeId, createdBy, approvedBy });
            }
        }
        finally {
            await session.close();
        }
    }
    static async softDeleteRelationship(treeId, fromId, toId, type, deletedBy) {
        const session = (0, database_1.getSession)();
        try {
            const reciprocalMap = {
                'parent': 'child',
                'child': 'parent',
                'spouse': 'spouse',
                'sibling': 'sibling',
                'adopted_child': 'parent'
            };
            const reciprocalType = reciprocalMap[type] || type;
            await session.run(`
        MATCH (a:Person {id: $fromId, treeId: $treeId})-[r:FAMILY_RELATIONSHIP {treeId: $treeId}]-(b:Person {id: $toId, treeId: $treeId})
        WHERE (r.type = $type AND startNode(r).id = $fromId AND endNode(r).id = $toId)
           OR (r.type = $reciprocalType AND startNode(r).id = $toId AND endNode(r).id = $fromId)
        SET r.deletedAt = timestamp(), r.deletedBy = $deletedBy
        `, { fromId, toId, type, reciprocalType, treeId, deletedBy });
        }
        finally {
            await session.close();
        }
    }
    static async getPendingProposals(treeId) {
        const session = (0, database_1.getSession)();
        try {
            const result = await session.run(`
        MATCH (rp:RelationshipProposal {status: 'pending'})
WHERE rp.treeId = $treeId

OPTIONAL MATCH (p1:Person {id: rp.fromPersonId})
OPTIONAL MATCH (p2:Person {id: rp.toPersonId})
OPTIONAL MATCH (u:User {id: rp.proposerId})

RETURN
  rp,
  p1,
  p2,
  u.email AS proposerEmail,
  COALESCE(u.name, u.email, 'Unknown User') AS proposerName

ORDER BY rp.createdAt DESC
        `, { treeId });
            return result.records.map(r => {
                const props = r.get('rp').properties;
                const p1Node = r.get('p1');
                const p2Node = r.get('p2');
                return {
                    ...(0, database_utils_1.normalizeNeo4jProperties)(props),
                    fromPerson: p1Node ? p1Node.properties : { firstName: 'Unknown', lastName: 'Person', id: props.fromPersonId },
                    toPerson: p2Node ? p2Node.properties : { firstName: 'Unknown', lastName: 'Person', id: props.toPersonId },
                    proposerEmail: r.get('proposerEmail') || 'unknown@user.com',
                    proposerName: r.get('proposerName') || 'Unknown User'
                };
            });
        }
        finally {
            await session.close();
        }
    }
    static async getSuggestedRelationships(personId, treeId) {
        const session = (0, database_1.getSession)();
        try {
            // 1. Sibling Suggestions (Shared Parents)
            const siblingResult = await session.run(`
        MATCH (p:Person {id: $personId, treeId: $treeId})
        MATCH (p)<-[:FAMILY_RELATIONSHIP {type: 'parent'}]-(parent:Person)
        MATCH (parent)-[:FAMILY_RELATIONSHIP {type: 'parent'}]->(potentialSibling:Person)
        WHERE potentialSibling.id <> $personId
        AND NOT (p)-[:FAMILY_RELATIONSHIP {type: 'sibling'}]-(potentialSibling)
        RETURN DISTINCT potentialSibling
        `, { personId, treeId });
            // 2. Spouse Suggestions (Shared Children)
            const spouseResult = await session.run(`
        MATCH (p:Person {id: $personId, treeId: $treeId})
        MATCH (p)-[:FAMILY_RELATIONSHIP {type: 'parent'}]->(child:Person)
        MATCH (potentialSpouse:Person)-[:FAMILY_RELATIONSHIP {type: 'parent'}]->(child)
        WHERE potentialSpouse.id <> $personId
        AND NOT (p)-[:FAMILY_RELATIONSHIP {type: 'spouse'}]-(potentialSpouse)
        RETURN DISTINCT potentialSpouse
        `, { personId, treeId });
            return {
                siblings: siblingResult.records.map(r => r.get('potentialSibling').properties),
                spouses: spouseResult.records.map(r => r.get('potentialSpouse').properties)
            };
        }
        finally {
            await session.close();
        }
    }
}
exports.RelationshipRepository = RelationshipRepository;
