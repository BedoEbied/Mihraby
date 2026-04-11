import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { registerSchema } from '@/lib/validators/auth';
import { ApiResponse, LoginResponse } from '@/types';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';
import { RefreshTokenService } from '@/lib/services/refreshTokenService';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_FAMILY_COOKIE = 'refresh_family';

function getRefreshTtlSeconds() {
  const days = Number(process.env.REFRESH_TOKEN_DAYS ?? 7);
  return days * 24 * 60 * 60;
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    const result = await AuthService.register(validatedData);
    const familyId = crypto.randomUUID();
    const refresh = await RefreshTokenService.issue(
      result.user.id,
      familyId,
      getRefreshTtlSeconds() * 1000
    );

    const response = NextResponse.json<ApiResponse<LoginResponse>>(
      {
        success: true,
        message: 'User registered successfully',
        data: { user: result.user }
      },
      { status: 201 }
    );

    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60,
    });

    response.cookies.set(REFRESH_COOKIE, refresh, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/refresh',
      maxAge: getRefreshTtlSeconds(),
    });

    response.cookies.set(REFRESH_FAMILY_COOKIE, familyId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/refresh',
      maxAge: getRefreshTtlSeconds(),
    });

    return response;
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Registration error:`, error);
    const wrapped =
      error instanceof Error && error.message === 'User with this email already exists'
        ? new ApiError(error.message, 409, ApiErrorCode.VALIDATION_ERROR)
        : error;
    return handleApiError(wrapped, requestId);
  }
}
