import { z } from 'zod';

export const publicInvitationRoleSchema = z.enum(['admin', 'member', 'viewer']);
export const accessRoleSchema = z.enum(['admin', 'member', 'viewer']);

export const generateInvitationSchema = z.object({
  role: publicInvitationRoleSchema,
});

export const createAdminInvitationSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
});

export const rejectAccessRequestSchema = z.object({
  reason: z.string().trim().min(1, 'Rejection reason is required'),
});

export const claimProfileSchema = z.object({
  personId: z.string().uuid(),
});

export type PublicInvitationRole = z.infer<typeof publicInvitationRoleSchema>;
export type AccessRole = z.infer<typeof accessRoleSchema>;

export interface TreeInvitation {
  id: string;
  token: string;
  treeId: string;
  role: PublicInvitationRole;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'revoked';
  revokedAt?: number;
  revokedBy?: string;
}

export interface AdminInvitation {
  id: string;
  treeId: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  createdBy: string;
  createdAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
  rejectionReason?: string;
}

export interface TreeAccessRequest {
  id: string;
  userId: string;
  treeId: string;
  requestedRole: AccessRole;
  status: 'pending' | 'approved' | 'rejected';
  upgradeFrom?: string;
  createdAt: number;
  processedAt?: number;
  processedBy?: string;
  rejectionReason?: string;
}
