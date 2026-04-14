import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/lib/db/models/Course';
import { withAuth } from '@/lib/middleware/auth';
import { ApiResponse, UserRole, CourseWithInstructor, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getPublishedCoursesHandler(_req: NextRequest, _context: { user: JwtPayload }) {
  try {
    const courses = await Course.findPublished();

    return NextResponse.json<ApiResponse<{ courses: CourseWithInstructor[]; count: number }>>({
      success: true,
      data: { courses, count: courses.length }
    });
  } catch (error) {
    const requestId = _req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Get courses error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth([UserRole.STUDENT], getPublishedCoursesHandler);
