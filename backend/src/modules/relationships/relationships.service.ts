import { RelationshipRepository } from './relationships.repository';
import { RelationshipValidation } from './relationships.validation';
import { CreateProposalInput } from '@shared/schemas/relationships';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { AppError } from '../../core/errors';
import { PeopleRepository } from '../people/people.repository';
import { TreesRepository } from '../trees/trees.repository';

export class RelationshipsService {
  static async proposeRelationship(input: CreateProposalInput, proposerId: string) {
    // 1. Authorization: User must have editor/owner permission on at least one person
    // or be a tree admin (tree admin check is handled by middleware verifyTreeAccess usually,
    // but here we check granular permission too)
    const permFrom = await PeopleRepository.checkPermission(input.fromPersonId, proposerId);
    const permTo = await PeopleRepository.checkPermission(input.toPersonId, proposerId);

    if (permFrom !== 'owner' && permFrom !== 'editor' && permTo !== 'owner' && permTo !== 'editor') {
      throw new AppError('You must have edit permission on at least one person to propose a relationship', 403);
    }

    // 2. Validate
    await RelationshipValidation.validate(
      input.treeId,
      input.fromPersonId,
      input.toPersonId,
      input.relationshipType
    );

    // 2. Create Proposal
    const proposal = await RelationshipRepository.createProposal({ ...input, proposerId });

    // 3. Log Audit
    await AuditService.log(
      input.treeId,
      proposerId,
      'relationship_proposed',
      'RelationshipProposal',
      proposal.id,
      { type: input.relationshipType, from: input.fromPersonId, to: input.toPersonId }
    );

    // 4. Notify Admins
    const adminIds = await TreesRepository.getAdmins(input.treeId);
    for (const adminId of adminIds) {
      await NotificationsService.createNotification(
        adminId,
        'relationship_pending',
        'New Relationship Proposal',
        `A new ${input.relationshipType} relationship has been proposed in your tree.`,
        { proposalId: proposal.id, treeId: input.treeId }
      );
    }

    return proposal;
  }

  static async approveProposal(proposalId: string, adminId: string) {
    const proposal = await RelationshipRepository.findProposalById(proposalId);
    if (!proposal) throw new AppError('Proposal not found', 404);
    if (proposal.status !== 'pending') throw new AppError('Proposal already processed', 400);

    // 1. Re-validate before making official (in case tree state changed)
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

    // 4. Log Audit
    await AuditService.log(
      proposal.treeId,
      adminId,
      'relationship_approved',
      'RelationshipProposal',
      proposalId,
      { proposerId: proposal.proposerId, type: proposal.relationshipType }
    );

    // 5. Update Tree Generations
    await PeopleRepository.updateTreeGenerations(proposal.treeId);

    // 6. Notify Proposer
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

    // 2. Log Audit
    await AuditService.log(
      proposal.treeId,
      adminId,
      'relationship_rejected',
      'RelationshipProposal',
      proposalId,
      { reason }
    );

    // 3. Notify Proposer
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

  static async getSuggestedRelationships(personId: string, treeId: string) {
    return RelationshipRepository.getSuggestedRelationships(personId, treeId);
  }
}
