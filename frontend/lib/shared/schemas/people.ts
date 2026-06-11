import { z } from 'zod';

export const visibilitySchema = z.enum(['private', 'editors', 'tree']).default('tree');

export const occupationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional().nullable(),
  visibility: visibilitySchema,
});

export const educationSchema = z.object({
  id: z.string().uuid(),
  school: z.string().min(1, "School is required"),
  degree: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  visibility: visibilitySchema,
});

export const personSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).default('unknown'),
  birthDate: z.string().optional().nullable(),
  deathDate: z.string().optional().nullable(),
  status: z.enum(['active', 'ghost', 'merged', 'archived', 'deceased']).default('ghost'),
  
  // Occupation & Education History
  occupations: z.array(occupationSchema).default([]),
  occupationSectionVisible: z.boolean().default(true),
  
  educations: z.array(educationSchema).default([]),
  educationSectionVisible: z.boolean().default(true),
  
  // Privacy Controls (Legacy single fields replaced by arrays above)
  phone: z.string().optional().nullable(),
  phoneVisibility: visibilitySchema,
  
  email: z.string().email().optional().nullable(),
  emailVisibility: visibilitySchema,
  
  address: z.string().optional().nullable(),
  addressVisibility: visibilitySchema,
  
  birthDateVisibility: visibilitySchema,
  imageUrl: z.string().url().optional().nullable(),
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
  deletedAt?: number | null;
};

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
