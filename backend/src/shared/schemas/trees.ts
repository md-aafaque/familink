import { z } from 'zod';

export const createTreeSchema = z.object({
  name: z.string().min(4, "Tree name must be at least 4 characters long").max(100, "Tree name too long"),
});

export type CreateTreeInput = z.infer<typeof createTreeSchema>;

export interface FamilyTree {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}
