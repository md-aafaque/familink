import { InvitationsRepository } from './invitations.repository';
import { InvitationType } from '@shared/schemas/invitations';
import { NotificationsService } from '../notifications/notifications.service';
import { AppError } from '../../core/errors';
import { getSession } from '../../core/database';

export class InvitationsService {
  static async generateInvitation(treeId: string, type: InvitationType, adminId: string) {
    return InvitationsRepository.createInvitation(treeId, type, adminId);
  }

  static async acceptInvitation(token: string, userId: string) {
    const invite = await InvitationsRepository.findInvitationByToken(token);
    if (!invite) throw new AppError('Invitation not found', 404);
    if (invite.expiresAt < Date.now()) throw new AppError('Invitation expired', 410);

    const currentRole = await InvitationsRepository.findUserCurrentRole(userId, invite.treeId);
    const roleHierarchy: Record<string, number> = { admin: 3, member: 2, viewer: 1 };
    
    // If user is already in the tree
    if (currentRole) {
      if (roleHierarchy[currentRole] >= roleHierarchy[invite.invitationType]) {
        return { success: true, message: 'You already have access to this tree', treeId: invite.treeId };
      }
      
      // Request upgrade
      const request = await InvitationsRepository.createAccessRequest(
        userId, 
        invite.treeId, 
        invite.invitationType,
        currentRole
      );

      // Notify Admins
      await this.notifyTreeAdmins(invite.treeId, 'access_request_pending', 'Role Upgrade Request', `A user is requesting to upgrade from ${currentRole} to ${invite.invitationType}`);

      return { success: true, message: 'Upgrade request submitted', status: 'pending' };
    }

    // New user joining tree
    // Auto-approve viewers? No, let's keep all for admin review for privacy unless it's an admin link
    if (invite.invitationType === 'admin') {
      await InvitationsRepository.addUserToTree(userId, invite.treeId, 'admin');
      return { success: true, message: 'Joined as admin', treeId: invite.treeId };
    }

    await InvitationsRepository.createAccessRequest(userId, invite.treeId, invite.invitationType);
    await this.notifyTreeAdmins(invite.treeId, 'access_request_pending', 'New Access Request', `A new user is requesting to join your family tree as a ${invite.invitationType}`);

    return { success: true, message: 'Access request submitted', status: 'pending' };
  }

  static async approveRequest(requestId: string, adminId: string) {
    const request = await InvitationsRepository.findRequestById(requestId);
    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'pending') throw new AppError('Request already processed', 400);

    await InvitationsRepository.addUserToTree(request.userId, request.treeId, request.requestedRole);
    await InvitationsRepository.updateRequestStatus(requestId, 'approved');

    await NotificationsService.createNotification(
      request.userId,
      'access_request_approved',
      'Welcome to the Family Tree',
      `Your request to join as a ${request.requestedRole} has been approved.`,
      { treeId: request.treeId }
    );

    return { success: true };
  }

  private static async notifyTreeAdmins(treeId: string, type: string, title: string, message: string) {
    const session = getSession();
    try {
      const admins = await session.run(
        `MATCH (u:User)-[:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId}) RETURN u.id as id`,
        { treeId }
      );
      for (const rec of admins.records) {
        await NotificationsService.createNotification(rec.get('id'), type, title, message, { treeId });
      }
    } finally {
      await session.close();
    }
  }

  static async getPendingRequests(treeId: string) {
    return InvitationsRepository.getPendingRequests(treeId);
  }
}
