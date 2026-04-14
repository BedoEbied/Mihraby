import { NextRequest, NextResponse } from 'next/server';
import { Enrollment } from '@/lib/db/models/Enrollment';
import { withAuth } from '@/lib/middleware/auth';
import { enrollCourseParamSchema } from '@/lib/validators/student';
import { ApiResponse, UserRole, JwtPayload } from '@/types';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';

/**
 * DELETE /api/student/unenroll/[courseId] - Unenroll from a course
 */
async function unenrollCourseHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const validatedParams = enrollCourseParamSchema.parse({ courseId: resolvedParams.courseId });
    const courseId = validatedParams.courseId;
    const userId = context.user.userId;

    const unenrolled = await Enrollment.unenroll(userId, courseId);

    if (!unenrolled) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Enrollment not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    const requestId = req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Unenroll error:`, error);
    const wrapped =
      error instanceof Error && error.message === 'Enrollment not found'
        ? new ApiError(error.message, 404, ApiErrorCode.NOT_FOUND)
        : error;
    return handleApiError(wrapped, requestId);
  }
}

export const DELETE = withAuth([UserRole.STUDENT], unenrollCourseHandler);
