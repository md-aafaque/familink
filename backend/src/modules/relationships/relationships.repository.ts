import { getSession } from '../../core/database';
import { CreateProposalInput, RelationshipProposal } from '@shared/schemas/relationships';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../core/errors';

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

      // 2. Handle bidirectional types
      if (['spouse', 'sibling'].includes(type)) {
        await session.run(
          `
          MATCH (a:Person {id: $fromId, treeId: $treeId}), (b:Person {id: $toId, treeId: $treeId})
          MERGE (b)-[r:FAMILY_RELATIONSHIP {type: $type, treeId: $treeId}]->(a)
          ON CREATE SET r.createdBy = $createdBy, 
                        r.approvedBy = $approvedBy, 
                        r.createdAt = timestamp()
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
        MATCH (rp:RelationshipProposal {status: 'pending'})
        WHERE rp.treeId = $treeId
        OPTIONAL MATCH (p1:Person {id: rp.fromPersonId})
        OPTIONAL MATCH (p2:Person {id: rp.toPersonId})
        OPTIONAL MATCH (u:User {id: rp.proposerId})
        RETURN rp, p1, p2, u.email as proposerEmail, u.name as proposerName
        ORDER BY rp.createdAt DESC
        `,
        { treeId }
      );

      const normalizeNumber = (value: any) =>
        typeof value === 'object' && value !== null && typeof value.toNumber === 'function'
          ? value.toNumber()
          : value;

      return result.records.map(r => {
        const rpNode = r.get('rp');
        const p1Node = r.get('p1');
        const p2Node = r.get('p2');
        
        const props = rpNode.properties;
        
        return {
          ...props,
          createdAt: normalizeNumber(props.createdAt),
          fromPerson: p1Node ? p1Node.properties : { firstName: 'Unknown', lastName: 'Person', id: props.fromPersonId },
          toPerson: p2Node ? p2Node.properties : { firstName: 'Unknown', lastName: 'Person', id: props.toPersonId },
          proposerEmail: r.get('proposerEmail') || 'unknown@user.com',
          proposerName: r.get('proposerName') || 'Unknown User'
        };
      });
    } finally {
      await session.close();
    }
  }
}
