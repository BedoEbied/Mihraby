import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { createCourseSchema, getAllCoursesQuerySchema } from '@/lib/validators/course';
import { ApiResponse, UserRole, CourseWithInstructor, ICourse, JwtPayload } from '@/types';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';
import { CourseService } from '@/lib/services/courseService';

/**
 * GET /api/courses - Get all courses with optional filtering and pagination
 * Public access
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryParams = {
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    // Validate query parameters
    const validatedQuery = getAllCoursesQuerySchema.parse(queryParams);
    
    const courses: CourseWithInstructor[] = await CourseService.getAllCourses(
      validatedQuery.status === 'published' ? 'published' : undefined
    );

    // Apply pagination
    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedCourses = courses.slice(startIndex, endIndex);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: paginatedCourses,
      // @ts-expect-error - adding pagination metadata
      pagination: {
        total: courses.length,
        page,
        limit,
        totalPages: Math.ceil(courses.length / limit),
      },
    });
  } catch (error) {
    const requestId = req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Get courses error:`, error);
    return handleApiError(error, requestId);
  }
}

/**
 * POST /api/courses - Create a new course
 * Instructor/Admin only
 */
async function createCourseHandler(req: NextRequest, context: { user: JwtPayload }) {
  try {
    const body = await req.json();
    
    // Validate request
    const validatedData = createCourseSchema.parse(body);
    const instructorId = context.user.userId;

    const course = await CourseService.createCourse(instructorId, validatedData);

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

export const POST = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], createCourseHandler);
