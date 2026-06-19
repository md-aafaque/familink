import { getSession } from '../../core/database';
import { CreateProposalInput, RelationshipProposal } from '../../shared/schemas/relationships';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../core/errors';
import { normalizeNeo4jProperties } from '../../core/database-utils';

export class RelationshipRepository {
  static async createProposal(input: CreateProposalInput & { proposerId: string }): Promise<RelationshipProposal> {
    const session = getSession();
    try {
      const id = uuidv4();
      const result = await session.run(
        `
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
        `,
        { ...input, id }
      );
      return result.records[0].get('rp').properties;
    } finally {
      await session.close();
    }
  }

  static async findProposalById(id: string): Promise<RelationshipProposal | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (rp:RelationshipProposal {id: $id}) RETURN rp`,
        { id }
      );
      if (result.records.length === 0) return null;
      return result.records[0].get('rp').properties;
    } finally {
      await session.close();
    }
  }

  static async updateProposalStatus(
    id: string, 
    status: 'approved' | 'rejected', 
    rejectionReason?: string
  ): Promise<void> {
    const session = getSession();
    try {
      const result = await session.run(
        `
        MATCH (rp:RelationshipProposal {id: $id})
        SET rp.status = $status,
            rp.rejectionReason = $rejectionReason,
            rp.processedAt = timestamp()
        RETURN rp
        `,
        { id, status, rejectionReason: rejectionReason || null }
      );
      if (result.records.length === 0) {
        throw new AppError('Proposal not found', 404);
      }
    } finally {
      await session.close();
    }
  }

  static async createOfficialRelationship(
    treeId: string,
    fromId: string,
    toId: string,
    type: string,
    createdBy: string,
    approvedBy: string
  ): Promise<void> {
    const session = getSession();
    try {
      const reciprocalMap: Record<string, string> = {
        'parent': 'child',
        'child': 'parent',
        'spouse': 'spouse',
        'sibling': 'sibling',
        'adopted_child': 'child'
      };

      const reciprocalType = reciprocalMap[type] || type;

      // 1. Create primary relationship
      const res1 = await session.run(
        `
        MATCH (a:Person {id: $fromId, treeId: $treeId}), (b:Person {id: $toId, treeId: $treeId})
        MERGE (a)-[r:FAMILY_RELATIONSHIP {type: $type, treeId: $treeId}]->(b)
        ON CREATE SET r.createdBy = $createdBy, 
                      r.approvedBy = $approvedBy, 
                      r.createdAt = timestamp()
        RETURN r
        `,
        { fromId, toId, type, treeId, createdBy, approvedBy }
      );

      if (res1.records.length === 0) {
        throw new AppError('Failed to create relationship: One or both people not found', 404);
      }

      // 2. Create reciprocal relationship
      await session.run(
        `
        MATCH (a:Person {id: $fromId, treeId: $treeId}), (b:Person {id: $toId, treeId: $treeId})
        MERGE (b)-[r:FAMILY_RELATIONSHIP {type: $reciprocalType, treeId: $treeId}]->(a)
        ON CREATE SET r.createdBy = $createdBy, 
                      r.approvedBy = $approvedBy, 
                      r.createdAt = timestamp()
        `,
        { fromId, toId, reciprocalType, treeId, createdBy, approvedBy }
      );

      // 3. Parent/Child Inference (when type = 'parent', 'child', or 'adopted_child')
      if (type === 'parent' || type === 'child' || type === 'adopted_child') {
        const parentId = (type === 'parent' || type === 'adopted_child') ? fromId : toId;
        const childId  = (type === 'parent' || type === 'adopted_child') ? toId : fromId;

        // 3a. Sibling inference: child's siblings get this parent
        await session.run(
          `
          MATCH (parent:Person {id: $parentId, treeId: $treeId})
          MATCH (child:Person {id: $childId, treeId: $treeId})
          OPTIONAL MATCH (child)<-[:FAMILY_RELATIONSHIP {type: 'sibling', treeId: $treeId}]-(sibling:Person)
          WHERE sibling.deletedAt IS NULL AND sibling.id <> $childId
          WITH parent, collect(DISTINCT sibling) as siblings
          FOREACH (s IN siblings |
            MERGE (parent)-[r1:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(s)
            ON CREATE SET r1.createdBy = $createdBy, r1.approvedBy = $approvedBy, r1.createdAt = timestamp()
            MERGE (s)-[r2:FAMILY_RELATIONSHIP {type: 'child', treeId: $treeId}]->(parent)
            ON CREATE SET r2.createdBy = $createdBy, r2.approvedBy = $approvedBy, r2.createdAt = timestamp()
          )
          `,
          { parentId, childId, treeId, createdBy, approvedBy }
        );

        // 3b. Full Sibling Closure: all of parent's children become siblings
        await session.run(
          `
          MATCH (parent:Person {id: $parentId, treeId: $treeId})
          OPTIONAL MATCH (parent)-[:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(child:Person)
          WHERE child.deletedAt IS NULL
          WITH collect(DISTINCT child) as allChildren
          UNWIND allChildren as c1
          UNWIND allChildren as c2
          WITH c1, c2 WHERE c1.id <> c2.id
          MERGE (c1)-[r1:FAMILY_RELATIONSHIP {type: 'sibling', treeId: $treeId}]->(c2)
          ON CREATE SET r1.createdBy = $createdBy, r1.approvedBy = $approvedBy, r1.createdAt = timestamp()
          MERGE (c2)-[r2:FAMILY_RELATIONSHIP {type: 'sibling', treeId: $treeId}]->(c1)
          ON CREATE SET r2.createdBy = $createdBy, r2.approvedBy = $approvedBy, r2.createdAt = timestamp()
          `,
          { parentId, treeId, createdBy, approvedBy }
        );

        // 3c. Spouse inference: parent's spouses get ALL parent's children
        await session.run(
          `
          MATCH (parent:Person {id: $parentId, treeId: $treeId})
          OPTIONAL MATCH (parent)<-[:FAMILY_RELATIONSHIP {type: 'spouse', treeId: $treeId}]-(spouse:Person)
          WHERE spouse.deletedAt IS NULL AND spouse.id <> $parentId
          OPTIONAL MATCH (parent)-[:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(child:Person)
          WHERE child.deletedAt IS NULL
          WITH spouse, child
          WHERE spouse IS NOT NULL AND child IS NOT NULL
          MERGE (spouse)-[r1:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(child)
          ON CREATE SET r1.createdBy = $createdBy, r1.approvedBy = $approvedBy, r1.createdAt = timestamp()
          MERGE (child)-[r2:FAMILY_RELATIONSHIP {type: 'child', treeId: $treeId}]->(spouse)
          ON CREATE SET r2.createdBy = $createdBy, r2.approvedBy = $approvedBy, r2.createdAt = timestamp()
          `,
          { parentId, treeId, createdBy, approvedBy }
        );

        // 3d. Spouse-Step-Sibling Closure: spouses' other children become step-siblings
        await session.run(
          `
          MATCH (parent:Person {id: $parentId, treeId: $treeId})
          OPTIONAL MATCH (parent)-[:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(pChild:Person)
          WHERE pChild.deletedAt IS NULL
          OPTIONAL MATCH (parent)<-[:FAMILY_RELATIONSHIP {type: 'spouse', treeId: $treeId}]-(spouse:Person)
          WHERE spouse.deletedAt IS NULL AND spouse.id <> $parentId
          OPTIONAL MATCH (spouse)-[:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(sChild:Person)
          WHERE sChild.deletedAt IS NULL AND sChild.id <> $parentId
          WITH collect(DISTINCT pChild) as pChildren, collect(DISTINCT sChild) as sChildren
          UNWIND pChildren as pc
          UNWIND sChildren as sc
          WITH pc, sc WHERE pc.id <> sc.id
          MERGE (pc)-[r1:FAMILY_RELATIONSHIP {type: 'sibling', treeId: $treeId}]->(sc)
          ON CREATE SET r1.createdBy = $createdBy, r1.approvedBy = $approvedBy, r1.createdAt = timestamp()
          MERGE (sc)-[r2:FAMILY_RELATIONSHIP {type: 'sibling', treeId: $treeId}]->(pc)
          ON CREATE SET r2.createdBy = $createdBy, r2.approvedBy = $approvedBy, r2.createdAt = timestamp()
          `,
          { parentId, treeId, createdBy, approvedBy }
        );
      }

      // 4. Sibling Parent Inference
      if (type === 'sibling') {
        await session.run(
          `
          MATCH (a:Person {id: $fromId, treeId: $treeId}), (b:Person {id: $toId, treeId: $treeId})
          
          // Parents of A -> become parents of B
          WITH a, b
          OPTIONAL MATCH (pA:Person)-[:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(a)
          WHERE pA.deletedAt IS NULL
          WITH a, b, collect(pA) as parentsA
          FOREACH (p in parentsA |
            MERGE (p)-[r1:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(b)
            ON CREATE SET r1.createdBy = $createdBy, r1.approvedBy = $approvedBy, r1.createdAt = timestamp()
            MERGE (b)-[r2:FAMILY_RELATIONSHIP {type: 'child', treeId: $treeId}]->(p)
            ON CREATE SET r2.createdBy = $createdBy, r2.approvedBy = $approvedBy, r2.createdAt = timestamp()
          )
          
          // Parents of B -> become parents of A
          WITH a, b
          OPTIONAL MATCH (pB:Person)-[:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(b)
          WHERE pB.deletedAt IS NULL
          WITH a, b, collect(pB) as parentsB
          FOREACH (p in parentsB |
            MERGE (p)-[r3:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(a)
            ON CREATE SET r3.createdBy = $createdBy, r3.approvedBy = $approvedBy, r3.createdAt = timestamp()
            MERGE (a)-[r4:FAMILY_RELATIONSHIP {type: 'child', treeId: $treeId}]->(p)
            ON CREATE SET r4.createdBy = $createdBy, r4.approvedBy = $approvedBy, r4.createdAt = timestamp()
          )
          `,
          { fromId, toId, treeId, createdBy, approvedBy }
        );
      }

      // 5. Spouse Inference (when type = 'spouse')
      if (type === 'spouse') {
        // Each spouse's children become children of the other spouse
        await session.run(
          `
          MATCH (p1:Person {id: $fromId, treeId: $treeId}), (p2:Person {id: $toId, treeId: $treeId})
          OPTIONAL MATCH (p1)-[:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(child:Person)
          WHERE child.deletedAt IS NULL
          WITH p2, collect(DISTINCT child) as childrenOfP1
          FOREACH (c IN childrenOfP1 |
            MERGE (p2)-[r1:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(c)
            ON CREATE SET r1.createdBy = $createdBy, r1.approvedBy = $approvedBy, r1.createdAt = timestamp()
            MERGE (c)-[r2:FAMILY_RELATIONSHIP {type: 'child', treeId: $treeId}]->(p2)
            ON CREATE SET r2.createdBy = $createdBy, r2.approvedBy = $approvedBy, r2.createdAt = timestamp()
          )
          `,
          { fromId, toId, treeId, createdBy, approvedBy }
        );

        // p2's children -> p1 becomes parent
        await session.run(
          `
          MATCH (p1:Person {id: $fromId, treeId: $treeId}), (p2:Person {id: $toId, treeId: $treeId})
          OPTIONAL MATCH (p2)-[:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(child:Person)
          WHERE child.deletedAt IS NULL
          WITH p1, collect(DISTINCT child) as childrenOfP2
          FOREACH (c IN childrenOfP2 |
            MERGE (p1)-[r1:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(c)
            ON CREATE SET r1.createdBy = $createdBy, r1.approvedBy = $approvedBy, r1.createdAt = timestamp()
            MERGE (c)-[r2:FAMILY_RELATIONSHIP {type: 'child', treeId: $treeId}]->(p1)
            ON CREATE SET r2.createdBy = $createdBy, r2.approvedBy = $approvedBy, r2.createdAt = timestamp()
          )
          `,
          { fromId, toId, treeId, createdBy, approvedBy }
        );

        // 5b. Full Sibling Closure: all children of both spouses become siblings
        await session.run(
          `
          MATCH (p1:Person {id: $fromId, treeId: $treeId})
          OPTIONAL MATCH (p1)-[:FAMILY_RELATIONSHIP {type: 'parent', treeId: $treeId}]->(child:Person)
          WHERE child.deletedAt IS NULL
          WITH collect(DISTINCT child) as allChildren
          UNWIND allChildren as c1
          UNWIND allChildren as c2
          WITH c1, c2 WHERE c1.id <> c2.id
          MERGE (c1)-[r1:FAMILY_RELATIONSHIP {type: 'sibling', treeId: $treeId}]->(c2)
          ON CREATE SET r1.createdBy = $createdBy, r1.approvedBy = $approvedBy, r1.createdAt = timestamp()
          MERGE (c2)-[r2:FAMILY_RELATIONSHIP {type: 'sibling', treeId: $treeId}]->(c1)
          ON CREATE SET r2.createdBy = $createdBy, r2.approvedBy = $approvedBy, r2.createdAt = timestamp()
          `,
          { fromId, treeId, createdBy, approvedBy }
        );
      }
    } finally {
      await session.close();
    }
  }

  static async softDeleteRelationship(
    treeId: string,
    fromId: string,
    toId: string,
    type: string,
    deletedBy: string
  ): Promise<void> {
    const session = getSession();
    try {
      const reciprocalMap: Record<string, string> = {
        'parent': 'child',
        'child': 'parent',
        'spouse': 'spouse',
        'sibling': 'sibling',
        'adopted_child': 'child'
      };
      const reciprocalType = reciprocalMap[type] || type;

      await session.run(
        `
        MATCH (a:Person {id: $fromId, treeId: $treeId})-[r:FAMILY_RELATIONSHIP {treeId: $treeId}]-(b:Person {id: $toId, treeId: $treeId})
        WHERE (r.type = $type AND startNode(r).id = $fromId AND endNode(r).id = $toId)
           OR (r.type = $reciprocalType AND startNode(r).id = $toId AND endNode(r).id = $fromId)
        SET r.deletedAt = timestamp(), r.deletedBy = $deletedBy
        `,
        { fromId, toId, type, reciprocalType, treeId, deletedBy }
      );
    } finally {
      await session.close();
    }
  }

  static async getPendingProposals(treeId: string) {
    const session = getSession();
    try {
      const result = await session.run(
        `
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
        `,
        { treeId }
      );

      return result.records.map(r => {
        const props = r.get('rp').properties;
        const p1Node = r.get('p1');
        const p2Node = r.get('p2');
        
        return {
          ...normalizeNeo4jProperties(props),
          fromPerson: p1Node ? normalizeNeo4jProperties(p1Node.properties) : { firstName: 'Unknown', lastName: 'Person', id: props.fromPersonId },
          toPerson: p2Node ? normalizeNeo4jProperties(p2Node.properties) : { firstName: 'Unknown', lastName: 'Person', id: props.toPersonId },
          proposerEmail: r.get('proposerEmail') || 'unknown@user.com',
          proposerName: r.get('proposerName') || 'Unknown User'
        };
      });
    } finally {
      await session.close();
    }
  }

  static async getSuggestedRelationships(personId: string, treeId: string) {
    const session = getSession();
    try {
      // 1. Sibling Suggestions (Shared Parents)
      const siblingResult = await session.run(
        `
        MATCH (p:Person {id: $personId, treeId: $treeId})
        MATCH (p)<-[:FAMILY_RELATIONSHIP {type: 'parent'}]-(parent:Person)
        MATCH (parent)-[:FAMILY_RELATIONSHIP {type: 'parent'}]->(potentialSibling:Person)
        WHERE potentialSibling.id <> $personId
        AND NOT (p)-[:FAMILY_RELATIONSHIP {type: 'sibling'}]-(potentialSibling)
        RETURN DISTINCT potentialSibling
        `,
        { personId, treeId }
      );

      // 2. Spouse Suggestions (Shared Children)
      const spouseResult = await session.run(
        `
        MATCH (p:Person {id: $personId, treeId: $treeId})
        MATCH (p)-[:FAMILY_RELATIONSHIP {type: 'parent'}]->(child:Person)
        MATCH (potentialSpouse:Person)-[:FAMILY_RELATIONSHIP {type: 'parent'}]->(child)
        WHERE potentialSpouse.id <> $personId
        AND NOT (p)-[:FAMILY_RELATIONSHIP {type: 'spouse'}]-(potentialSpouse)
        RETURN DISTINCT potentialSpouse
        `,
        { personId, treeId }
      );

      return {
        siblings: siblingResult.records.map(r => r.get('potentialSibling').properties),
        spouses: spouseResult.records.map(r => r.get('potentialSpouse').properties)
      };
    } finally {
      await session.close();
    }
  }
}
