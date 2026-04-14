import { z } from 'zod';
import { UserRole } from '@/types';

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole, { message: 'Invalid role' })
});

export const userIdSchema = z.object({
  id: z.coerce.number().int().min(1, 'Invalid user ID')
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UserIdInput = z.infer<typeof userIdSchema>;
