import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/lib/db/models/Course';
import { withAuth } from '@/lib/middleware/auth';
import { updateCourseSchema, courseIdSchema } from '@/lib/validators/course';
import { ApiResponse, UserRole, JwtPayload } from '@/types';
import { checkPolicy } from '@/lib/authorization/checkPolicy';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';

/**
 * PUT /api/instructor/courses/[id] - Update own course
 */
async function updateInstructorCourseHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const validatedParams = courseIdSchema.parse({ id: resolvedParams.id });
    const courseId = validatedParams.id;
    
    const body = await req.json();
    const validatedData = updateCourseSchema.parse(body);

    // Check if course exists and belongs to instructor (unless admin)
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Course not found'
        },
        { status: 404 }
      );
    }

    // Only course owner can update (unless admin)
    const canUpdate = checkPolicy(
      { id: context.user.userId, role: context.user.role },
      'course:update',
      course
    );
    if (!canUpdate) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'You can only update your own courses'
        },
        { status: 403 }
      );
    }

    const updated = await Course.update(courseId, validatedData);

    if (!updated) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'No updates provided'
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Course updated successfully'
    });
  } catch (error) {
    const requestId = req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Update course error:`, error);
    const wrapped =
      error instanceof Error && error.message === 'Course not found'
        ? new ApiError(error.message, 404, ApiErrorCode.NOT_FOUND)
        : error instanceof Error && error.message.toLowerCase().includes('only update')
          ? new ApiError(error.message, 403, ApiErrorCode.FORBIDDEN)
          : error;
    return handleApiError(wrapped, requestId);
  }
}

/**
 * DELETE /api/instructor/courses/[id] - Delete own course
 */
async function deleteInstructorCourseHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const validatedParams = courseIdSchema.parse({ id: resolvedParams.id });
    const courseId = validatedParams.id;

    // Check if course exists and belongs to instructor (unless admin)
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Course not found'
        },
        { status: 404 }
      );
    }

    // Only course owner can delete (unless admin)
    const canDelete = checkPolicy(
      { id: context.user.userId, role: context.user.role },
      'course:delete',
      course
    );
    if (!canDelete) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'You can only delete your own courses'
        },
        { status: 403 }
      );
    }

    await Course.delete(courseId);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    const requestId = req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Delete course error:`, error);
    const wrapped =
      error instanceof Error && error.message === 'Course not found'
        ? new ApiError(error.message, 404, ApiErrorCode.NOT_FOUND)
        : error instanceof Error && error.message.toLowerCase().includes('only delete')
          ? new ApiError(error.message, 403, ApiErrorCode.FORBIDDEN)
          : error;
    return handleApiError(wrapped, requestId);
  }
}

export const PUT = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], updateInstructorCourseHandler);
export const DELETE = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], deleteInstructorCourseHandler);
