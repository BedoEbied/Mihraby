import { z } from 'zod';

export const courseIdParamSchema = z.object({
  id: z.coerce.number().int().min(1, 'Invalid course ID')
});

export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
