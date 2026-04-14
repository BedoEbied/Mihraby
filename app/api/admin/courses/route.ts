import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/lib/db/models/Course';
import { withAuth } from '@/lib/middleware/auth';
import { ApiResponse, UserRole, CourseWithInstructor } from '@/types';
import { JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

/**
 * GET /api/admin/courses - Get all courses (including drafts)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getAllAdminCoursesHandler(_req: NextRequest, _context: { user: JwtPayload }) {
  try {
    const courses = await Course.findAll();

    return NextResponse.json<ApiResponse<{ courses: CourseWithInstructor[]; count: number }>>({
      success: true,
      data: { courses, count: courses.length }
    });
  } catch (error) {
    const requestId = _req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Get admin courses error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth([UserRole.ADMIN, UserRole.INSTRUCTOR], getAllAdminCoursesHandler);
