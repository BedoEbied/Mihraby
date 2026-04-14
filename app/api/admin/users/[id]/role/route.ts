import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/db/models/User';
import { withAuth } from '@/lib/middleware/auth';
import { updateUserRoleSchema, userIdSchema } from '@/lib/validators/admin';
import { ApiResponse, UserRole, JwtPayload } from '@/types';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';

/**
 * PUT /api/admin/users/[id]/role - Update user role
 */
async function updateUserRoleHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const validatedParams = userIdSchema.parse({ id: resolvedParams.id });
    const userId = validatedParams.id;
    
    const body = await req.json();
    const validatedData = updateUserRoleSchema.parse(body);

    const updated = await User.updateRole(userId, validatedData.role);

    if (!updated) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    const requestId = req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Update user role error:`, error);
    const wrapped =
      error instanceof Error && error.message === 'User not found'
        ? new ApiError(error.message, 404, ApiErrorCode.NOT_FOUND)
        : error;
    return handleApiError(wrapped, requestId);
  }
}

export const PUT = withAuth([UserRole.ADMIN, UserRole.INSTRUCTOR], updateUserRoleHandler);
