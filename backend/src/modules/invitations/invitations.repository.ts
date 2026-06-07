import { getSession } from '../../core/database';
import { AccessRole, AdminInvitation, PublicInvitationRole, TreeAccessRequest, TreeInvitation } from '@shared/schemas/invitations';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../core/errors';

export class InvitationsRepository {
  static async createInvitation(treeId: string, role: PublicInvitationRole, createdBy: string): Promise<TreeInvitation> {
    const session = getSession();
    try {
      const id = uuidv4();
      const token = uuidv4();
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      const result = await session.run(
        `
        MATCH (t:FamilyTree {id: $treeId})
        CREATE (i:TreeInvitation {
          id: $id,
          token: $token,
          treeId: $treeId,
          role: $role,
          createdBy: $createdBy,
          createdAt: timestamp(),
          expiresAt: $expiresAt,
          status: 'active'
        })-[:FOR_TREE]->(t)
        RETURN i
        `,
        { id, treeId, role, createdBy, token, expiresAt }
      );

      if (result.records.length === 0) {
        throw new AppError('Failed to create invitation: Tree not found', 404);
      }

      return result.records[0].get('i').properties;
    } finally {
      await session.close();
    }
  }

  static async createAdminInvitation(treeId: string, email: string, createdBy: string): Promise<AdminInvitation> {
    const session = getSession();
    try {
      const id = uuidv4();
      const result = await session.run(
        `
        MATCH (t:FamilyTree {id: $treeId})
        CREATE (i:AdminInvitation {
          id: $id,
          treeId: $treeId,
          email: $email,
          status: 'pending',
          createdBy: $createdBy,
          createdAt: timestamp()
        })-[:FOR_TREE]->(t)
        RETURN i
        `,
        { id, treeId, email, createdBy }
      );

      if (result.records.length === 0) {
        throw new AppError('Failed to create admin invitation: Tree not found', 404);
      }

      return result.records[0].get('i').properties;
    } finally {
      await session.close();
    }
  }

  static async findInvitationByToken(token: string): Promise<TreeInvitation | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (i:TreeInvitation {token: $token, status: 'active'}) RETURN i`,
        { token }
      );
      if (result.records.length === 0) return null;
      return result.records[0].get('i').properties;
    } finally {
      await session.close();
    }
  }

  static async createAccessRequest(
    userId: string, 
    treeId: string, 
    requestedRole: AccessRole,
    upgradeFrom?: string
  ): Promise<TreeAccessRequest> {
    const session = getSession();
    try {
      const id = uuidv4();
      const result = await session.run(
        `
        MATCH (u:User {id: $userId}), (t:FamilyTree {id: $treeId})
        CREATE (u)-[:HAS_ACCESS_REQUEST]->(ar:TreeAccessRequest {
          id: $id,
          userId: $userId,
          treeId: $treeId,
          requestedRole: $requestedRole,
          upgradeFrom: $upgradeFrom,
          status: 'pending',
          createdAt: timestamp()
        })-[:REQUESTS_ACCESS_TO]->(t)
        RETURN ar
        `,
        { id, userId, treeId, requestedRole, upgradeFrom: upgradeFrom || null }
      );

      if (result.records.length === 0) {
        throw new AppError('Failed to create access request: User or Tree not found', 404);
      }

      return result.records[0].get('ar').properties;
    } finally {
      await session.close();
    }
  }

  static async findRequestById(id: string): Promise<TreeAccessRequest | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (ar:TreeAccessRequest {id: $id}) RETURN ar`,
        { id }
      );
      if (result.records.length === 0) return null;
      return result.records[0].get('ar').properties;
    } finally {
      await session.close();
    }
  }

  static async updateRequestStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (ar:TreeAccessRequest {id: $id}) 
         SET ar.status = $status, ar.processedAt = timestamp()
         RETURN ar`,
        { id, status }
      );
      if (result.records.length === 0) {
        throw new AppError('Access request not found', 404);
      }
    } finally {
      await session.close();
    }
  }

  static async rejectRequest(id: string, adminId: string, reason: string): Promise<void> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (ar:TreeAccessRequest {id: $id, status: 'pending'})
         SET ar.status = 'rejected',
             ar.processedAt = timestamp(),
             ar.processedBy = $adminId,
             ar.rejectionReason = $reason
         RETURN ar`,
        { id, adminId, reason }
      );
      if (result.records.length === 0) {
        throw new AppError('Access request not found or already processed', 404);
      }
    } finally {
      await session.close();
    }
  }

  static async addUserToTree(userId: string, treeId: string, role: string): Promise<void> {
    const session = getSession();
    try {
      // Use MERGE for the relationship but update the role
      const result = await session.run(
        `
        MATCH (u:User {id: $userId}), (t:FamilyTree {id: $treeId})
        MERGE (u)-[r:MEMBER_OF]->(t)
        SET r.role = $role, r.joinedAt = timestamp()
        RETURN r
        `,
        { userId, treeId, role }
      );
      if (result.records.length === 0) {
        throw new AppError('Failed to link user to tree: User or Tree not found', 404);
      }
    } finally {
      await session.close();
    }
  }

  static async getPendingRequests(treeId: string): Promise<any[]> {
    const session = getSession();
    try {
      const result = await session.run(
        `
        MATCH (ar:TreeAccessRequest {treeId: $treeId, status: 'pending'})
        MATCH (u:User {id: ar.userId})
        RETURN ar, u.email as email, u.name as name
        ORDER BY ar.createdAt DESC
        `,
        { treeId }
      );
      return result.records.map(r => ({
        ...r.get('ar').properties,
        userEmail: r.get('email'),
        userName: r.get('name')
      }));
    } finally {
      await session.close();
    }
  }

  static async findUserCurrentRole(userId: string, treeId: string): Promise<string | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(t:FamilyTree {id: $treeId}) RETURN r.role as role`,
        { userId, treeId }
      );
      if (result.records.length === 0) return null;
      return result.records[0].get('role');
    } finally {
      await session.close();
    }
  }

  static async listInvitations(treeId: string): Promise<TreeInvitation[]> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (i:TreeInvitation {treeId: $treeId, status: 'active'}) 
         RETURN i ORDER BY i.createdAt DESC`,
        { treeId }
      );
      return result.records.map(r => r.get('i').properties);
    } finally {
      await session.close();
    }
  }

  static async revokeInvitation(treeId: string, invitationId: string, revokedBy: string): Promise<void> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (i:TreeInvitation {id: $invitationId, treeId: $treeId, status: 'active'})
         SET i.status = 'revoked',
             i.revokedAt = timestamp(),
             i.revokedBy = $revokedBy
         RETURN i`,
        { treeId, invitationId, revokedBy }
      );
      if (result.records.length === 0) {
        throw new AppError('Invitation not found or already inactive', 404);
      }
    } finally {
      await session.close();
    }
  }
}
