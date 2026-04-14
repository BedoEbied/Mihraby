import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/lib/db/models/Course';
import { withAuth } from '@/lib/middleware/auth';
import { createCourseSchema } from '@/lib/validators/course';
import { ApiResponse, UserRole, ICourse, JwtPayload } from '@/types';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';

/**
 * GET /api/instructor/courses - Get instructor's own courses
 */
async function getInstructorCoursesHandler(_req: NextRequest, context: { user: JwtPayload }) {
  try {
    const courses = await Course.findByInstructor(context.user.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { courses, count: courses.length }
    });
  } catch (error) {
    const requestId = _req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Get instructor courses error:`, error);
    return handleApiError(error, requestId);
  }
}

/**
 * POST /api/instructor/courses - Create new course
 */
async function createInstructorCourseHandler(req: NextRequest, context: { user: JwtPayload }) {
  try {
    const body = await req.json();
    const validatedData = createCourseSchema.parse(body);

    const course = await Course.create(validatedData, context.user.userId);

    return NextResponse.json<ApiResponse<ICourse>>(
      {
        success: true,
        message: 'Course created successfully',
        data: course
      },
      { status: 201 }
    );
  } catch (error) {
    const requestId = req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Create course error:`, error);
    const wrapped =
      error instanceof Error && error.message.toLowerCase().includes('validation')
        ? new ApiError(error.message, 400, ApiErrorCode.VALIDATION_ERROR)
        : error;
    return handleApiError(wrapped, requestId);
  }
}

export const GET = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], getInstructorCoursesHandler);
export const POST = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], createInstructorCourseHandler);
