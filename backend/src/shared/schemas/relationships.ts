import { z } from 'zod';

export const relationshipTypeSchema = z.enum([
  'parent',
  'child',
  'spouse',
  'sibling',
  'adopted_child'
]);

export const createProposalSchema = z.object({
  treeId: z.string().uuid(),
  fromPersonId: z.string().uuid(),
  toPersonId: z.string().uuid(),
  relationshipType: relationshipTypeSchema,
});

export const rejectProposalSchema = z.object({
  reason: z.string().min(1, "Reason is required for rejection"),
});

export type RelationshipType = z.infer<typeof relationshipTypeSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;

export interface RelationshipProposal {
  id: string;
  treeId: string;
  proposerId: string;
  fromPersonId: string;
  toPersonId: string;
  relationshipType: RelationshipType;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: number;
}
