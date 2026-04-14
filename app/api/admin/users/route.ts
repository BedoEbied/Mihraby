import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/db/models/User';
import { withAuth } from '@/lib/middleware/auth';
import { ApiResponse, UserRole, UserWithoutPassword, JwtPayload } from '@/types';

/**
 * GET /api/admin/users - Get all users
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getAllUsersHandler(_req: NextRequest, _context: { user: JwtPayload }) {
  try {
    const users = await User.findAll();

    return NextResponse.json<ApiResponse<{ users: UserWithoutPassword[]; count: number }>>({
      success: true,
      data: { users, count: users.length }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: 'Error fetching users',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth([UserRole.ADMIN, UserRole.INSTRUCTOR], getAllUsersHandler);
