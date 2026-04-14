import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { withAuth } from '@/lib/middleware/auth';
import { ApiResponse, UserWithoutPassword, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

async function handler(_req: NextRequest, context: { user: JwtPayload }) {
  try {
    const user = await AuthService.getCurrentUser(context.user.userId);

    return NextResponse.json<ApiResponse<{ user: UserWithoutPassword }>>(
      {
        success: true,
        data: { user }
      },
      { status: 200 }
    );
  } catch (error) {
    const requestId = _req.headers.get('x-request-id') ?? undefined;
    console.error(`[${requestId ?? 'no-id'}] Get me error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth('all', handler);
