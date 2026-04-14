import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/lib/db/models/Course';
import { Enrollment } from '@/lib/db/models/Enrollment';
import { withAuth } from '@/lib/middleware/auth';
import { enrollCourseParamSchema } from '@/lib/validators/student';
import { ApiResponse, UserRole, IEnrollment, JwtPayload } from '@/types';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';

/**
 * POST /api/student/enroll/[courseId] - Enroll in a course
 */
async function enrollCourseHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const validatedParams = enrollCourseParamSchema.parse({ courseId: resolvedParams.courseId });
    const courseId = validatedParams.courseId;
    const userId = context.user.userId;

    // Check if course exists
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

    // Check if already enrolled
    const alreadyEnrolled = await Enrollment.isEnrolled(userId, courseId);
    if (alreadyEnrolled) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Already enrolled in this course'
        },
        { status: 409 }
      );
    }

    // Enroll user
    const enrollment = await Enrollment.enroll(userId, courseId);

    return NextResponse.json<ApiResponse<{ enrollment: IEnrollment }>>(
      {
        success: true,
        message: 'Successfully enrolled in course',
        data: { enrollment }
      },
      { status: 201 }
    );
  } catch (error) {
    const requestId = req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Enroll error:`, error);
    const wrapped =
      error instanceof Error && error.message === 'Course not found'
        ? new ApiError(error.message, 404, ApiErrorCode.NOT_FOUND)
        : error instanceof Error && error.message.includes('Already enrolled')
          ? new ApiError(error.message, 409, ApiErrorCode.VALIDATION_ERROR)
          : error;
    return handleApiError(wrapped, requestId);
  }
}

export const POST = withAuth([UserRole.STUDENT], enrollCourseHandler);
