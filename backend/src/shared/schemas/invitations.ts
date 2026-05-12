import { z } from 'zod';

export const invitationTypeSchema = z.enum(['admin', 'member', 'viewer']);

export const generateInvitationSchema = z.object({
  invitationType: invitationTypeSchema,
});

export const acceptInvitationSchema = z.object({
  token: z.string().uuid(),
});

export const processRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

export const claimProfileSchema = z.object({
  personId: z.string().uuid(),
});

export type InvitationType = z.infer<typeof invitationTypeSchema>;

export interface TreeInvitation {
  token: string;
  treeId: string;
  invitationType: InvitationType;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'used' | 'expired';
}

export interface TreeAccessRequest {
  id: string;
  userId: string;
  treeId: string;
  requestedRole: InvitationType;
  status: 'pending' | 'approved' | 'rejected';
  upgradeFrom?: string;
  createdAt: number;
  processedAt?: number;
}
