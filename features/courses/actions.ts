'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { CourseService } from '@/lib/services/courseService';
import { verifyToken } from '@/lib/auth/server';
import { createCourseSchema, updateCourseSchema } from '@/lib/validators/course';
import { CreateCourseDTO, UpdateCourseDTO } from '@/types';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) throw new Error('Not authenticated');
  return verifyToken(token);
}

export async function createCourseAction(formData: FormData) {
  try {
    const user = await getCurrentUser();

    const price = parseFloat(formData.get('price') as string);
    const data: CreateCourseDTO = {
      title: formData.get('title') as string,
      description: formData.get('description') as string | undefined,
      price,
      image_url: formData.get('image_url') as string | undefined,
      status: formData.get('status') as 'draft' | 'published' | undefined,
      // Phase 2 fields (defaults kept server-side too)
      price_per_slot: price,
    };

    const validatedData = createCourseSchema.parse(data);
    const course = await CourseService.createCourse(user.userId, validatedData);

    revalidateTag('courses', 'default');
    revalidatePath('/instructor/courses');
    revalidatePath('/courses');

    return { success: true, data: course };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create course',
    };
  }
}

export async function updateCourseAction(courseId: number, formData: FormData) {
  try {
    const user = await getCurrentUser();

    const data: UpdateCourseDTO = {
      title: formData.get('title') as string | undefined,
      description: formData.get('description') as string | undefined,
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : undefined,
      image_url: formData.get('image_url') as string | undefined,
      status: formData.get('status') as 'draft' | 'published' | 'archived' | undefined,
    };

    const validatedData = updateCourseSchema.parse(data);
    const updatedCourse = await CourseService.updateCourse(
      user.userId,
      user.role,
      courseId,
      validatedData
    );

    revalidateTag('courses', 'default');
    revalidatePath('/instructor/courses');
    revalidatePath('/courses');
    revalidatePath(`/courses/${courseId}`);

    return { success: true, data: updatedCourse };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update course',
    };
  }
}

export async function deleteCourseAction(courseId: number) {
  try {
    const user = await getCurrentUser();

    await CourseService.deleteCourse(user.userId, user.role, courseId);

    revalidateTag('courses', 'default');
    revalidatePath('/instructor/courses');
    revalidatePath('/courses');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete course',
    };
  }
}
