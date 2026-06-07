"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationsService = void 0;
const invitations_repository_1 = require("./invitations.repository");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
const errors_1 = require("../../core/errors");
const trees_repository_1 = require("../trees/trees.repository");
class InvitationsService {
    static async generateInvitation(treeId, role, adminId) {
        const invite = await invitations_repository_1.InvitationsRepository.createInvitation(treeId, role, adminId);
        await audit_service_1.AuditService.log(treeId, adminId, 'invitation_generated', 'Invitation', invite.id, { role });
        return invite;
    }
    static async createAdminInvitation(treeId, email, adminId) {
        const invite = await invitations_repository_1.InvitationsRepository.createAdminInvitation(treeId, email, adminId);
        await audit_service_1.AuditService.log(treeId, adminId, 'admin_invitation_created', 'AdminInvitation', invite.id, { email });
        return invite;
    }
    static async acceptInvitation(token, userId) {
        const invite = await invitations_repository_1.InvitationsRepository.findInvitationByToken(token);
        if (!invite)
            throw new errors_1.AppError('Invitation not found', 404);
        if (invite.expiresAt < Date.now())
            throw new errors_1.AppError('Invitation expired', 410);
        const currentRole = await invitations_repository_1.InvitationsRepository.findUserCurrentRole(userId, invite.treeId);
        const roleHierarchy = { admin: 3, member: 2, viewer: 1 };
        // If user is already in the tree
        if (currentRole) {
            if (roleHierarchy[currentRole] >= roleHierarchy[invite.role]) {
                return { success: true, message: 'You already have access to this tree', treeId: invite.treeId };
            }
            // Request upgrade
            await invitations_repository_1.InvitationsRepository.createAccessRequest(userId, invite.treeId, invite.role, currentRole);
            // Notify Admins
            await this.notifyTreeAdmins(invite.treeId, 'access_request_pending', 'Role Upgrade Request', `A user is requesting to upgrade from ${currentRole} to ${invite.role}`);
            return { success: true, message: 'Upgrade request submitted', status: 'pending' };
        }
        // All roles now go through access request for security (Admin override can be added later if needed)
        await invitations_repository_1.InvitationsRepository.createAccessRequest(userId, invite.treeId, invite.role);
        await audit_service_1.AuditService.log(invite.treeId, userId, 'invitation_accepted', 'Invitation', invite.id, { requestedRole: invite.role });
        await this.notifyTreeAdmins(invite.treeId, 'access_request_pending', 'New Access Request', `A new user is requesting to join your family tree as a ${invite.role}`);
        return { success: true, message: 'Access request submitted', status: 'pending' };
    }
    static async approveRequest(requestId, adminId) {
        const request = await invitations_repository_1.InvitationsRepository.findRequestById(requestId);
        if (!request)
            throw new errors_1.AppError('Request not found', 404);
        if (request.status !== 'pending')
            throw new errors_1.AppError('Request already processed', 400);
        await invitations_repository_1.InvitationsRepository.addUserToTree(request.userId, request.treeId, request.requestedRole);
        await invitations_repository_1.InvitationsRepository.updateRequestStatus(requestId, 'approved');
        await audit_service_1.AuditService.log(request.treeId, adminId, 'member_joined', 'User', request.userId, { role: request.requestedRole, requestId });
        await notifications_service_1.NotificationsService.createNotification(request.userId, 'access_request_approved', 'Welcome to the Family Tree', `Your request to join as a ${request.requestedRole} has been approved.`, { treeId: request.treeId });
        return { success: true };
    }
    static async rejectRequest(requestId, reason, adminId) {
        const request = await invitations_repository_1.InvitationsRepository.findRequestById(requestId);
        if (!request)
            throw new errors_1.AppError('Request not found', 404);
        if (request.status !== 'pending')
            throw new errors_1.AppError('Request already processed', 400);
        await invitations_repository_1.InvitationsRepository.rejectRequest(requestId, adminId, reason);
        await audit_service_1.AuditService.log(request.treeId, adminId, 'access_request_rejected', 'TreeAccessRequest', requestId, { requestedRole: request.requestedRole, reason });
        await notifications_service_1.NotificationsService.createNotification(request.userId, 'access_request_rejected', 'Access Request Rejected', `Your request to join as a ${request.requestedRole} was rejected.`, { treeId: request.treeId, reason });
        return { success: true };
    }
    static async revokeInvitation(treeId, invitationId, adminId) {
        await invitations_repository_1.InvitationsRepository.revokeInvitation(treeId, invitationId, adminId);
        await audit_service_1.AuditService.log(treeId, adminId, 'invitation_revoked', 'Invitation', invitationId);
        return { success: true };
    }
    static async notifyTreeAdmins(treeId, type, title, message) {
        const adminIds = await trees_repository_1.TreesRepository.getAdmins(treeId);
        for (const adminId of adminIds) {
            await notifications_service_1.NotificationsService.createNotification(adminId, type, title, message, { treeId });
        }
    }
    static async getPendingRequests(treeId) {
        return invitations_repository_1.InvitationsRepository.getPendingRequests(treeId);
    }
}
exports.InvitationsService = InvitationsService;
