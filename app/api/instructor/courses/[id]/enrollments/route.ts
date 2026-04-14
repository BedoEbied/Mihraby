import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/lib/db/models/Course';
import { Enrollment } from '@/lib/db/models/Enrollment';
import { withAuth } from '@/lib/middleware/auth';
import { courseIdSchema } from '@/lib/validators/course';
import { ApiResponse, UserRole, EnrollmentWithDetails, JwtPayload } from '@/types';
import { checkPolicy } from '@/lib/authorization/checkPolicy';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';

/**
 * GET /api/instructor/courses/[id]/enrollments - Get enrollments for a course
 */
async function getCourseEnrollmentsHandler(
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

    // Only course owner can view enrollments (unless admin)
    const canView = checkPolicy(
      { id: context.user.userId, role: context.user.role },
      'course:update',
      course
    );
    if (!canView) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'You can only view enrollments for your own courses'
        },
        { status: 403 }
      );
    }

    const enrollments = await Enrollment.getCourseEnrollments(courseId);

    return NextResponse.json<ApiResponse<{ enrollments: EnrollmentWithDetails[]; count: number }>>({
      success: true,
      data: { enrollments, count: enrollments.length }
    });
  } catch (error) {
    const requestId = req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Get enrollments error:`, error);
    const wrapped =
      error instanceof Error && error.message === 'Course not found'
        ? new ApiError(error.message, 404, ApiErrorCode.NOT_FOUND)
        : error instanceof Error && error.message.toLowerCase().includes('only view')
          ? new ApiError(error.message, 403, ApiErrorCode.FORBIDDEN)
          : error;
    return handleApiError(wrapped, requestId);
  }
}

export const GET = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], getCourseEnrollmentsHandler);
