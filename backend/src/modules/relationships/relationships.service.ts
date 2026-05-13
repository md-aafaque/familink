import { RelationshipRepository } from './relationships.repository';
import { RelationshipValidation } from './relationships.validation';
import { CreateProposalInput } from '@shared/schemas/relationships';
import { NotificationsService } from '../notifications/notifications.service';
import { AppError } from '../../core/errors';
import { getSession } from '../../core/database';

export class RelationshipsService {
  static async proposeRelationship(input: CreateProposalInput, proposerId: string) {
    // 1. Validate
    await RelationshipValidation.validate(
      input.treeId,
      input.fromPersonId,
      input.toPersonId,
      input.relationshipType
    );

    // 2. Create Proposal
    const proposal = await RelationshipRepository.createProposal({ ...input, proposerId });

    // 3. Notify Admins
    const session = getSession();
    try {
      const adminsResult = await session.run(
        `MATCH (u:User)-[:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId}) RETURN u.id as id`,
        { treeId: input.treeId }
      );
      
      const adminIds = adminsResult.records.map(r => r.get('id'));
      for (const adminId of adminIds) {
        await NotificationsService.createNotification(
          adminId,
          'relationship_pending',
          'New Relationship Proposal',
          `A new ${input.relationshipType} relationship has been proposed in your tree.`,
          { proposalId: proposal.id, treeId: input.treeId }
        );
      }
    } finally {
      await session.close();
    }

    return proposal;
  }

  static async approveProposal(proposalId: string, adminId: string) {
    const proposal = await RelationshipRepository.findProposalById(proposalId);
    if (!proposal) throw new AppError('Proposal not found', 404);
    if (proposal.status !== 'pending') throw new AppError('Proposal already processed', 400);

    // 1. Re-validate before making official (in case tree state changed)
    // We exclude the current proposal from the "already pending" check
    await RelationshipValidation.validate(
      proposal.treeId,
      proposal.fromPersonId,
      proposal.toPersonId,
      proposal.relationshipType,
      proposalId
    );

    // 2. Update Status
    await RelationshipRepository.updateProposalStatus(proposalId, 'approved');

    // 3. Create Official Relationship
    await RelationshipRepository.createOfficialRelationship(
      proposal.treeId,
      proposal.fromPersonId,
      proposal.toPersonId,
      proposal.relationshipType,
      proposal.proposerId,
      adminId
    );

    // 4. Notify Proposer
    await NotificationsService.createNotification(
      proposal.proposerId,
      'relationship_approved',
      'Relationship Approved',
      `Your proposed ${proposal.relationshipType} relationship has been approved.`,
      { proposalId, treeId: proposal.treeId }
    );

    return { success: true };
  }

  static async rejectProposal(proposalId: string, reason: string, adminId: string) {
    const proposal = await RelationshipRepository.findProposalById(proposalId);
    if (!proposal) throw new AppError('Proposal not found', 404);
    if (proposal.status !== 'pending') throw new AppError('Proposal already processed', 400);

    // 1. Update Status
    await RelationshipRepository.updateProposalStatus(proposalId, 'rejected', reason);

    // 2. Notify Proposer
    await NotificationsService.createNotification(
      proposal.proposerId,
      'relationship_rejected',
      'Relationship Rejected',
      `Your proposed ${proposal.relationshipType} relationship was rejected: ${reason}`,
      { proposalId, treeId: proposal.treeId, reason }
    );

    return { success: true };
  }

  static async getPendingProposals(treeId: string) {
    return RelationshipRepository.getPendingProposals(treeId);
  }
}
