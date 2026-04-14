import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/lib/db/models/Course';
import { withAuth } from '@/lib/middleware/auth';
import { userIdSchema } from '@/lib/validators/admin';
import { ApiResponse, UserRole, JwtPayload } from '@/types';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';

/**
 * DELETE /api/admin/courses/[id] - Delete any course
 */
async function deleteAdminCourseHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const validatedParams = userIdSchema.parse({ id: resolvedParams.id });
    const courseId = validatedParams.id;

    const deleted = await Course.delete(courseId);

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Course not found'
        },
        { status: 404 }
      );
    }

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
        : error;
    return handleApiError(wrapped, requestId);
  }
}

export const DELETE = withAuth([UserRole.ADMIN, UserRole.INSTRUCTOR], deleteAdminCourseHandler);
