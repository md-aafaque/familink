import { z } from 'zod';

export const createTreeSchema = z.object({
  name: z.string().min(1, "Tree name is required").max(100, "Tree name too long"),
});

export type CreateTreeInput = z.infer<typeof createTreeSchema>;

export interface FamilyTree {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}
