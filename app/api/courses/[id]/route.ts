import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '@/lib/services/courseService';
import { withAuth } from '@/lib/middleware/auth';
import { updateCourseSchema, courseIdSchema } from '@/lib/validators/course';
import { ApiResponse, UserRole, ICourse, JwtPayload } from '@/types';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';

/**
 * GET /api/courses/[id] - Get a single course by ID
 * Public access
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const validatedParams = courseIdSchema.parse({ id: resolvedParams.id });
    const course = await CourseService.getCourseById(validatedParams.id);

    return NextResponse.json<ApiResponse<ICourse>>({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course error:', error);
    const err =
      error instanceof Error && error.message === 'Course not found'
        ? new ApiError(error.message, 404, ApiErrorCode.NOT_FOUND)
        : error;
    return handleApiError(err);
  }
}

/**
 * PUT /api/courses/[id] - Update a course
 * Instructor/Admin only
 */
async function updateCourseHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const validatedParams = courseIdSchema.parse({ id: resolvedParams.id });
    const body = await req.json();
    const validatedData = updateCourseSchema.parse(body);

    const updatedCourse = await CourseService.updateCourse(
      context.user.userId,
      context.user.role,
      validatedParams.id,
      validatedData
    );

    return NextResponse.json<ApiResponse<ICourse>>({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    const err =
      error instanceof Error && error.message === 'Course not found'
        ? new ApiError(error.message, 404, ApiErrorCode.NOT_FOUND)
        : error instanceof Error && error.message.includes('Not authorized')
          ? new ApiError(error.message, 403, ApiErrorCode.FORBIDDEN)
          : error;
    return handleApiError(err);
  }
}

/**
 * DELETE /api/courses/[id] - Delete a course
 * Instructor/Admin only
 */
async function deleteCourseHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const validatedParams = courseIdSchema.parse({ id: resolvedParams.id });

    await CourseService.deleteCourse(
      context.user.userId,
      context.user.role,
      validatedParams.id
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    const err =
      error instanceof Error && error.message === 'Course not found'
        ? new ApiError(error.message, 404, ApiErrorCode.NOT_FOUND)
        : error instanceof Error && error.message.includes('Not authorized')
          ? new ApiError(error.message, 403, ApiErrorCode.FORBIDDEN)
          : error;
    return handleApiError(err);
  }
}

export const PUT = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], updateCourseHandler);
export const DELETE = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], deleteCourseHandler);
