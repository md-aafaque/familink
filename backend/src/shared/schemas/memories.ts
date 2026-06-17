import { z } from 'zod';

export const MemoryTypeSchema = z.enum(['milestone', 'story', 'photo']);

const partialDateSchema = z.string().regex(/^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/, "Invalid date format. Use YYYY, YYYY-MM, or YYYY-MM-DD");

const BaseMemorySchema = z.object({
  treeId: z.string().uuid(),
  type: MemoryTypeSchema,
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  imageUrl: z.string().url().optional(),
  date: partialDateSchema, // String format: YYYY, YYYY-MM, or YYYY-MM-DD
  associatedPersonIds: z.array(z.string().uuid()).optional(),
});

export const CreateMemorySchema = BaseMemorySchema.superRefine((data, ctx) => {
  if (data.type === 'story' && (!data.content || data.content.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Story content is required for "story" type memories',
      path: ['content'],
    });
  }
  if (data.type === 'photo' && !data.imageUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Image URL is required for "photo" type memories',
      path: ['imageUrl'],
    });
  }
});

export const UpdateMemorySchema = BaseMemorySchema.partial().omit({ treeId: true });

export type MemoryType = z.infer<typeof MemoryTypeSchema>;
export type CreateMemoryInput = z.infer<typeof CreateMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof UpdateMemorySchema>;

export interface Memory {
  id: string;
  treeId: string;
  type: MemoryType;
  title: string;
  content?: string;
  imageUrl?: string;
  date: string;
  posterId: string;
  createdAt: number;
  deletedAt?: number;
  deletedBy?: string;
  associatedPeople?: { id: string; firstName: string; lastName: string }[];
}
