import { NextRequest, NextResponse } from 'next/server';
import { Enrollment } from '@/lib/db/models/Enrollment';
import { withAuth } from '@/lib/middleware/auth';
import { ApiResponse, UserRole, EnrollmentWithDetails, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

/**
 * GET /api/student/my-courses - Get user's enrolled courses
 */
async function getMyCoursesHandler(_req: NextRequest, context: { user: JwtPayload }) {
  try {
    const enrollments = await Enrollment.getUserEnrollments(context.user.userId);

    return NextResponse.json<ApiResponse<{ enrollments: EnrollmentWithDetails[]; count: number }>>({
      success: true,
      data: { enrollments, count: enrollments.length }
    });
  } catch (error) {
    const requestId = _req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Get my courses error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth([UserRole.STUDENT], getMyCoursesHandler);
