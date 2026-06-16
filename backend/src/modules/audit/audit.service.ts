import { AuditRepository } from './audit.repository';

export type AuditAction = 
  | 'tree_created'
  | 'tree_renamed'
  | 'tree_deleted'
  | 'person_created'
  | 'person_updated'
  | 'person_deleted'
  | 'relationship_proposed'
  | 'relationship_approved'
  | 'relationship_rejected'
  | 'invitation_generated'
  | 'invitation_accepted'
  | 'admin_invitation_created'
  | 'invitation_revoked'
  | 'access_request_rejected'
  | 'claim_requested'
  | 'claim_approved'
  | 'claim_rejected'
  | 'person_merged'
  | 'permission_granted'
  | 'permission_revoked'
  | 'member_joined'
  | 'memory_created'
  | 'memory_updated'
  | 'memory_deleted'
  | 'deletion_proposed'
  | 'deletion_approved'
  | 'deletion_rejected'
  | 'merge_proposed'
  | 'merge_approved'
  | 'merge_rejected';

export class AuditService {
  static async log(
    treeId: string,
    actorId: string,
    actionType: AuditAction,
    entityType: string,
    entityId: string,
    metadata: any = {}
  ) {
    await AuditRepository.log(treeId, actorId, actionType, entityType, entityId, metadata);
  }

  static async getTreeLogs(treeId: string, limit: number = 50) {
    return AuditRepository.findByTreeId(treeId, limit);
  }
}
