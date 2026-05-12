import { getSession } from '../../core/database';
import { CreateProposalInput, RelationshipProposal } from '@shared/schemas/relationships';
import { v4 as uuidv4 } from 'uuid';

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
      await session.run(
        `
        MATCH (rp:RelationshipProposal {id: $id})
        SET rp.status = $status,
            rp.rejectionReason = $rejectionReason,
            rp.processedAt = timestamp()
        `,
        { id, status, rejectionReason: rejectionReason || null }
      );
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
      // 1. Create primary relationship
      await session.run(
        `
        MATCH (a:Person {id: $fromId}), (b:Person {id: $toId})
        CREATE (a)-[r:FAMILY_RELATIONSHIP {
          type: $type,
          treeId: $treeId,
          createdBy: $createdBy,
          approvedBy: $approvedBy,
          createdAt: timestamp()
        }]->(b)
        `,
        { fromId, toId, type, treeId, createdBy, approvedBy }
      );

      // 2. Handle bidirectional types
      if (['spouse', 'sibling'].includes(type)) {
        await session.run(
          `
          MATCH (a:Person {id: $fromId}), (b:Person {id: $toId})
          MERGE (b)-[r:FAMILY_RELATIONSHIP {type: $type, treeId: $treeId}]->(a)
          ON CREATE SET r.createdBy = $createdBy, r.approvedBy = $approvedBy, r.createdAt = timestamp()
          `,
          { fromId, toId, type, treeId, createdBy, approvedBy }
        );
      }
    } finally {
      await session.close();
    }
  }

  static async getPendingProposals(treeId: string): Promise<any[]> {
    const session = getSession();
    try {
      const result = await session.run(
        `
        MATCH (rp:RelationshipProposal {treeId: $treeId, status: 'pending'})
        MATCH (p1:Person {id: rp.fromPersonId})
        MATCH (p2:Person {id: rp.toPersonId})
        MATCH (u:User {id: rp.proposerId})
        RETURN rp, p1, p2, u.email as proposerEmail
        ORDER BY rp.createdAt DESC
        `,
        { treeId }
      );
      return result.records.map(r => ({
        ...r.get('rp').properties,
        fromPerson: r.get('p1').properties,
        toPerson: r.get('p2').properties,
        proposerEmail: r.get('proposerEmail')
      }));
    } finally {
      await session.close();
    }
  }
}
