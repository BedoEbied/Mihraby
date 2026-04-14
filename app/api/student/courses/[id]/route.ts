import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/lib/db/models/Course';
import { withAuth } from '@/lib/middleware/auth';
import { courseIdParamSchema } from '@/lib/validators/student';
import { ApiResponse, UserRole, ICourse, JwtPayload } from '@/types';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';

/**
 * GET /api/student/courses/[id] - Get course details
 */
async function getCourseDetailsHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const validatedParams = courseIdParamSchema.parse({ id: resolvedParams.id });
    const course = await Course.findById(validatedParams.id);

    if (!course) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Course not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ course: ICourse }>>({
      success: true,
      data: { course }
    });
  } catch (error) {
    const requestId = req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Get course error:`, error);
    const wrapped =
      error instanceof Error && error.message === 'Course not found'
        ? new ApiError(error.message, 404, ApiErrorCode.NOT_FOUND)
        : error;
    return handleApiError(wrapped, requestId);
  }
}

export const GET = withAuth([UserRole.STUDENT], getCourseDetailsHandler);
