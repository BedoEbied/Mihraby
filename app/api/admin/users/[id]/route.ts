import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/db/models/User';
import { withAuth } from '@/lib/middleware/auth';
import { userIdSchema } from '@/lib/validators/admin';
import { ApiResponse, UserRole, JwtPayload } from '@/types';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';

/**
 * DELETE /api/admin/users/[id] - Delete user
 */
async function deleteUserHandler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const validatedParams = userIdSchema.parse({ id: resolvedParams.id });
    const userId = validatedParams.id;

    // Prevent self-deletion
    if (context.user.userId === userId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'Cannot delete your own account'
        },
        { status: 400 }
      );
    }

    const deleted = await User.delete(userId);

    if (!deleted) {
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
      message: 'User deleted successfully'
    });
  } catch (error) {
    const requestId = req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Delete user error:`, error);
    const wrapped =
      error instanceof Error && error.message === 'Cannot delete your own account'
        ? new ApiError(error.message, 400, ApiErrorCode.FORBIDDEN)
        : error instanceof Error && error.message === 'User not found'
          ? new ApiError(error.message, 404, ApiErrorCode.NOT_FOUND)
          : error;
    return handleApiError(wrapped, requestId);
  }
}

export const DELETE = withAuth([UserRole.ADMIN, UserRole.INSTRUCTOR], deleteUserHandler);
