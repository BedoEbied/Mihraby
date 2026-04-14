import { z } from 'zod';

export const courseIdParamSchema = z.object({
  id: z.coerce.number().int().min(1, 'Invalid course ID')
});

export const enrollCourseParamSchema = z.object({
  courseId: z.coerce.number().int().min(1, 'Invalid course ID')
});

export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
export type EnrollCourseParam = z.infer<typeof enrollCourseParamSchema>;
