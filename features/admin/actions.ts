'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { AdminService } from '@/lib/services/adminService';
import { verifyToken } from '@/lib/auth/server';
import { updateUserRoleSchema } from '@/lib/validators/admin';
import { UserRole } from '@/types';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) throw new Error('Not authenticated');
  return verifyToken(token);
}

export async function updateUserRoleAction(userId: number, role: UserRole) {
  try {
    const user = await getCurrentUser();

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.INSTRUCTOR) {
      throw new Error('Unauthorized');
    }

    const validatedData = updateUserRoleSchema.parse({ role });
    await AdminService.updateUserRole(userId, validatedData.role);

    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user role',
    };
  }
}

export async function deleteUserAction(userId: number) {
  try {
    const user = await getCurrentUser();

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.INSTRUCTOR) {
      throw new Error('Unauthorized');
    }

    await AdminService.deleteUser(user.userId, userId);

    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

export async function deleteCourseAdminAction(courseId: number) {
  try {
    const user = await getCurrentUser();

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.INSTRUCTOR) {
      throw new Error('Unauthorized');
    }

    await AdminService.deleteCourse(courseId);

    revalidateTag('courses', 'default');
    revalidatePath('/admin/courses');
    revalidatePath('/courses');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete course',
    };
  }
}
