import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';
import { handleApiError } from '@/lib/api/errors';
import { RefreshTokenService } from '@/lib/services/refreshTokenService';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_FAMILY_COOKIE = 'refresh_family';

/**
 * GET /api/auth/logout
 * Added for client compatibility; mirrors POST since logout is stateless.
 */
export async function GET(req: NextRequest) {
  try {
    const familyId = req.cookies.get(REFRESH_FAMILY_COOKIE)?.value;
    if (familyId) {
      await RefreshTokenService.revokeFamily(familyId);
    }
    const response = NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Logout successful. Please remove token from client.'
      },
      { status: 200 }
    );
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    response.cookies.set(REFRESH_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/refresh',
      maxAge: 0,
    });
    response.cookies.set(REFRESH_FAMILY_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/refresh',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  // In JWT stateless auth, logout is handled client-side by removing token
  // This endpoint can be used for future token blacklisting/invalidation
  try {
    const familyId = req.cookies.get(REFRESH_FAMILY_COOKIE)?.value;
    if (familyId) {
      await RefreshTokenService.revokeFamily(familyId);
    }
    const response = NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Logout successful. Please remove token from client.'
      },
      { status: 200 }
    );
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    response.cookies.set(REFRESH_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/refresh',
      maxAge: 0,
    });
    response.cookies.set(REFRESH_FAMILY_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/refresh',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
