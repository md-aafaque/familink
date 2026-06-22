import { z } from 'zod';

export const visibilitySchema = z.enum(['private', 'editors', 'tree']).default('tree');

const partialDateSchema = z.string().regex(/^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/, "Invalid date format. Use YYYY, YYYY-MM, or YYYY-MM-DD");

export const occupationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().optional().nullable(),
  startDate: partialDateSchema,
  endDate: z.string().optional().nullable().or(z.literal("")),
  isCurrent: z.boolean().default(false),
  description: z.string().optional().nullable(),
  visibility: visibilitySchema,
}).superRefine((data, ctx) => {
  if (data.endDate && data.endDate !== "") {
    if (!/^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/.test(data.endDate)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid date format. Use YYYY, YYYY-MM, or YYYY-MM-DD",
            path: ["endDate"],
        });
    }
  }
});

export const educationSchema = z.object({
  id: z.string().uuid(),
  school: z.string().min(1, "School is required"),
  degree: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  startDate: partialDateSchema,
  endDate: z.string().optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable(),
  visibility: visibilitySchema,
}).superRefine((data, ctx) => {
    if (data.endDate && data.endDate !== "") {
        if (!/^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/.test(data.endDate)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid date format. Use YYYY, YYYY-MM, or YYYY-MM-DD",
                path: ["endDate"],
            });
        }
    }
});

export const personSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).default('unknown'),
  birthDate: partialDateSchema, // Mandatory: at least the year must be provided
  deathDate: partialDateSchema.optional().nullable(),
  status: z.enum(['active', 'ghost', 'merged', 'archived', 'deceased']).default('ghost'),
  
  // Occupation & Education History
  occupations: z.array(occupationSchema).default([]),
  occupationSectionVisible: z.boolean().default(true),
  
  educations: z.array(educationSchema).default([]),
  educationSectionVisible: z.boolean().default(true),
  
  // Privacy Controls
  phone: z.string().optional().nullable(),
  phoneVisibility: visibilitySchema,
  
  email: z.string().email().optional().nullable().or(z.literal("")),
  emailVisibility: visibilitySchema,
  
  address: z.string().optional().nullable(),
  addressVisibility: visibilitySchema,
  
  birthDateVisibility: visibilitySchema,
  imageUrl: z.string().url().optional().nullable(),
});

export const createPersonSchema = personSchema.extend({
  treeId: z.string().uuid(),
  linkToId: z.string().uuid().optional(),
  linkRelationshipType: z.enum(['parent', 'child', 'spouse', 'sibling']).optional(),
});

export const updatePersonSchema = personSchema.partial();

export const deletionProposalSchema = z.object({
  reason: z.string().optional(),
});

export const mergeProposalSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  reason: z.string().optional(),
});

export type Person = z.infer<typeof personSchema> & {
  id: string;
  treeId: string;
  createdBy: string;
  createdAt: number;
  deletedAt?: number | null;
  userPermission?: 'owner' | 'editor' | 'viewer';
};

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;

export interface DeletionProposal {
  id: string;
  treeId: string;
  personId: string;
  proposerId: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: number;
}

export interface MergeProposal {
  id: string;
  treeId: string;
  sourceId: string;
  targetId: string;
  proposerId: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: number;
}
