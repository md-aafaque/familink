"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipsService = void 0;
const relationships_repository_1 = require("./relationships.repository");
const relationships_validation_1 = require("./relationships.validation");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
const errors_1 = require("../../core/errors");
const people_repository_1 = require("../people/people.repository");
const trees_repository_1 = require("../trees/trees.repository");
class RelationshipsService {
    static async proposeRelationship(input, proposerId) {
        // 1. Authorization: User must have editor/owner permission on at least one person
        // or be a tree admin (tree admin check is handled by middleware verifyTreeAccess usually,
        // but here we check granular permission too)
        const permFrom = await people_repository_1.PeopleRepository.checkPermission(input.fromPersonId, proposerId);
        const permTo = await people_repository_1.PeopleRepository.checkPermission(input.toPersonId, proposerId);
        if (permFrom !== 'owner' && permFrom !== 'editor' && permTo !== 'owner' && permTo !== 'editor') {
            throw new errors_1.AppError('You must have edit permission on at least one person to propose a relationship', 403);
        }
        // 2. Validate
        await relationships_validation_1.RelationshipValidation.validate(input.treeId, input.fromPersonId, input.toPersonId, input.relationshipType);
        // 2. Create Proposal
        const proposal = await relationships_repository_1.RelationshipRepository.createProposal({ ...input, proposerId });
        // 3. Log Audit
        await audit_service_1.AuditService.log(input.treeId, proposerId, 'relationship_proposed', 'RelationshipProposal', proposal.id, { type: input.relationshipType, from: input.fromPersonId, to: input.toPersonId });
        // 4. Notify Admins
        const adminIds = await trees_repository_1.TreesRepository.getAdmins(input.treeId);
        for (const adminId of adminIds) {
            await notifications_service_1.NotificationsService.createNotification(adminId, 'relationship_pending', 'New Relationship Proposal', `A new ${input.relationshipType} relationship has been proposed in your tree.`, { proposalId: proposal.id, treeId: input.treeId });
        }
        return proposal;
    }
    static async approveProposal(proposalId, adminId) {
        const proposal = await relationships_repository_1.RelationshipRepository.findProposalById(proposalId);
        if (!proposal)
            throw new errors_1.AppError('Proposal not found', 404);
        if (proposal.status !== 'pending')
            throw new errors_1.AppError('Proposal already processed', 400);
        // 1. Re-validate before making official (in case tree state changed)
        await relationships_validation_1.RelationshipValidation.validate(proposal.treeId, proposal.fromPersonId, proposal.toPersonId, proposal.relationshipType, proposalId);
        // 2. Update Status
        await relationships_repository_1.RelationshipRepository.updateProposalStatus(proposalId, 'approved');
        // 3. Create Official Relationship
        await relationships_repository_1.RelationshipRepository.createOfficialRelationship(proposal.treeId, proposal.fromPersonId, proposal.toPersonId, proposal.relationshipType, proposal.proposerId, adminId);
        // 4. Log Audit
        await audit_service_1.AuditService.log(proposal.treeId, adminId, 'relationship_approved', 'RelationshipProposal', proposalId, { proposerId: proposal.proposerId, type: proposal.relationshipType });
        // 5. Notify Proposer
        await notifications_service_1.NotificationsService.createNotification(proposal.proposerId, 'relationship_approved', 'Relationship Approved', `Your proposed ${proposal.relationshipType} relationship has been approved.`, { proposalId, treeId: proposal.treeId });
        return { success: true };
    }
    static async rejectProposal(proposalId, reason, adminId) {
        const proposal = await relationships_repository_1.RelationshipRepository.findProposalById(proposalId);
        if (!proposal)
            throw new errors_1.AppError('Proposal not found', 404);
        if (proposal.status !== 'pending')
            throw new errors_1.AppError('Proposal already processed', 400);
        // 1. Update Status
        await relationships_repository_1.RelationshipRepository.updateProposalStatus(proposalId, 'rejected', reason);
        // 2. Log Audit
        await audit_service_1.AuditService.log(proposal.treeId, adminId, 'relationship_rejected', 'RelationshipProposal', proposalId, { reason });
        // 3. Notify Proposer
        await notifications_service_1.NotificationsService.createNotification(proposal.proposerId, 'relationship_rejected', 'Relationship Rejected', `Your proposed ${proposal.relationshipType} relationship was rejected: ${reason}`, { proposalId, treeId: proposal.treeId, reason });
        return { success: true };
    }
    static async getPendingProposals(treeId) {
        return relationships_repository_1.RelationshipRepository.getPendingProposals(treeId);
    }
    static async getSuggestedRelationships(personId, treeId) {
        return relationships_repository_1.RelationshipRepository.getSuggestedRelationships(personId, treeId);
    }
}
exports.RelationshipsService = RelationshipsService;
