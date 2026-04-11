import { NextRequest, NextResponse } from 'next/server';
import { RefreshTokenService } from '@/lib/services/refreshTokenService';
import { generateToken } from '@/lib/auth/server';
import { AuthService } from '@/lib/services/authService';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/types';

const REFRESH_COOKIE = 'refresh_token';

function getRefreshTtlMs() {
  const days = Number(process.env.REFRESH_TOKEN_DAYS ?? 7);
  return days * 24 * 60 * 60 * 1000;
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const token = req.cookies.get(REFRESH_COOKIE)?.value;
    if (!token) throw new ApiError('Missing refresh token', 401, ApiErrorCode.AUTH_FAILED);

    const rotated = await RefreshTokenService.rotate(token, getRefreshTtlMs());
    const user = await AuthService.getCurrentUser(rotated.userId);
    const accessToken = generateToken(user.id, user.email, user.role);

    const res = NextResponse.json<ApiResponse<{ user: typeof user }>>(
      { success: true, data: { user } },
      { status: 200 }
    );

    // Access cookie
    res.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60, // overwritten by JWT exp, but keeps cookie short-lived too
    });

    // Refresh cookie (scoped only to refresh endpoint)
    res.cookies.set(REFRESH_COOKIE, rotated.newToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/refresh',
      maxAge: Math.floor(getRefreshTtlMs() / 1000),
    });

    return res;
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Refresh error:`, error);
    return handleApiError(error, requestId);
  }
}

