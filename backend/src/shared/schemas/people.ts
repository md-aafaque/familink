import { z } from 'zod';

export const visibilitySchema = z.enum(['private', 'editors', 'tree']).default('tree');

export const personSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).default('unknown'),
  birthDate: z.string().optional().nullable(),
  deathDate: z.string().optional().nullable(),
  status: z.enum(['active', 'ghost', 'merged', 'archived', 'deceased']).default('ghost'),
  
  // Privacy Controls
  phone: z.string().optional().nullable(),
  phoneVisibility: visibilitySchema,
  
  email: z.string().email().optional().nullable(),
  emailVisibility: visibilitySchema,
  
  address: z.string().optional().nullable(),
  addressVisibility: visibilitySchema,
  
  birthDateVisibility: visibilitySchema,
  generation: z.number().optional().nullable(),
});

export const createPersonSchema = personSchema.extend({
  treeId: z.string().uuid(),
});

export const updatePersonSchema = personSchema.partial();

export type Person = z.infer<typeof personSchema> & {
  id: string;
  treeId: string;
  createdBy: string;
  createdAt: number;
  generation?: number | null;
  deletedAt?: number | null;
};

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
