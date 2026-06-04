import { InvitationsRepository } from './invitations.repository';
import { PublicInvitationRole } from '@shared/schemas/invitations';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { AppError } from '../../core/errors';
import { UsersRepository } from '../users/users.repository';
import { TreesRepository } from '../trees/trees.repository';

export class InvitationsService {
  static async generateInvitation(treeId: string, role: PublicInvitationRole, adminId: string) {
    const invite = await InvitationsRepository.createInvitation(treeId, role, adminId);
    
    await AuditService.log(
      treeId,
      adminId,
      'invitation_generated',
      'Invitation',
      invite.id,
      { role }
    );

    return invite;
  }

  static async createAdminInvitation(treeId: string, email: string, adminId: string) {
    const invite = await InvitationsRepository.createAdminInvitation(treeId, email, adminId);

    await AuditService.log(
      treeId,
      adminId,
      'admin_invitation_created',
      'AdminInvitation',
      invite.id,
      { email }
    );

    return invite;
  }

  static async acceptInvitation(token: string, userId: string) {
    const invite = await InvitationsRepository.findInvitationByToken(token);
    if (!invite) throw new AppError('Invitation not found', 404);
    if (invite.expiresAt < Date.now()) throw new AppError('Invitation expired', 410);

    const currentRole = await InvitationsRepository.findUserCurrentRole(userId, invite.treeId);
    const roleHierarchy: Record<string, number> = { admin: 3, member: 2, viewer: 1 };
    
    // If user is already in the tree
    if (currentRole) {
      if (roleHierarchy[currentRole] >= roleHierarchy[invite.role]) {
        return { success: true, message: 'You already have access to this tree', treeId: invite.treeId };
      }
      
      // Request upgrade
      await InvitationsRepository.createAccessRequest(
        userId, 
        invite.treeId, 
        invite.role,
        currentRole
      );

      // Notify Admins
      await this.notifyTreeAdmins(invite.treeId, 'access_request_pending', 'Role Upgrade Request', `A user is requesting to upgrade from ${currentRole} to ${invite.role}`);

      return { success: true, message: 'Upgrade request submitted', status: 'pending' };
    }

    // All roles now go through access request for security (Admin override can be added later if needed)
    await InvitationsRepository.createAccessRequest(userId, invite.treeId, invite.role);
    
    await AuditService.log(
      invite.treeId,
      userId,
      'invitation_accepted',
      'Invitation',
      invite.id,
      { requestedRole: invite.role }
    );

    await this.notifyTreeAdmins(invite.treeId, 'access_request_pending', 'New Access Request', `A new user is requesting to join your family tree as a ${invite.role}`);

    return { success: true, message: 'Access request submitted', status: 'pending' };
  }

  static async approveRequest(requestId: string, adminId: string) {
    const request = await InvitationsRepository.findRequestById(requestId);
    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'pending') throw new AppError('Request already processed', 400);

    await InvitationsRepository.addUserToTree(request.userId, request.treeId, request.requestedRole);
    await InvitationsRepository.updateRequestStatus(requestId, 'approved');

    await AuditService.log(
      request.treeId,
      adminId,
      'member_joined',
      'User',
      request.userId,
      { role: request.requestedRole, requestId }
    );

    await NotificationsService.createNotification(
      request.userId,
      'access_request_approved',
      'Welcome to the Family Tree',
      `Your request to join as a ${request.requestedRole} has been approved.`,
      { treeId: request.treeId }
    );

    return { success: true };
  }

  static async rejectRequest(requestId: string, reason: string, adminId: string) {
    const request = await InvitationsRepository.findRequestById(requestId);
    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'pending') throw new AppError('Request already processed', 400);

    await InvitationsRepository.rejectRequest(requestId, adminId, reason);

    await AuditService.log(
      request.treeId,
      adminId,
      'access_request_rejected',
      'TreeAccessRequest',
      requestId,
      { requestedRole: request.requestedRole, reason }
    );

    await NotificationsService.createNotification(
      request.userId,
      'access_request_rejected',
      'Access Request Rejected',
      `Your request to join as a ${request.requestedRole} was rejected.`,
      { treeId: request.treeId, reason }
    );

    return { success: true };
  }

  static async revokeInvitation(treeId: string, invitationId: string, adminId: string) {
    await InvitationsRepository.revokeInvitation(treeId, invitationId, adminId);

    await AuditService.log(
      treeId,
      adminId,
      'invitation_revoked',
      'Invitation',
      invitationId
    );

    return { success: true };
  }

  private static async notifyTreeAdmins(treeId: string, type: string, title: string, message: string) {
    const adminIds = await TreesRepository.getAdmins(treeId);
    for (const adminId of adminIds) {
      await NotificationsService.createNotification(adminId, type, title, message, { treeId });
    }
  }

  static async getPendingRequests(treeId: string) {
    return InvitationsRepository.getPendingRequests(treeId);
  }
}
