import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/lib/db/models/Course';
import { courseIdSchema } from '@/lib/validators/course';
import { ApiResponse, ICourse } from '@/types';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';

/**
 * GET /api/courses/instructor/[instructorId] - Get all courses by instructor
 * Public access
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  try {
    const resolvedParams = await params;
    const validatedParams = courseIdSchema.parse({ id: resolvedParams.instructorId });
    const courses = await Course.findByInstructor(validatedParams.id);

    return NextResponse.json<ApiResponse<ICourse[]>>({
      success: true,
      data: courses
    });
  } catch (error) {
    const requestId = req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Get instructor courses error:`, error);
    const wrapped =
      error instanceof Error && error.message.toLowerCase().includes('invalid')
        ? new ApiError(error.message, 400, ApiErrorCode.VALIDATION_ERROR)
        : error;
    return handleApiError(wrapped, requestId);
  }
}
