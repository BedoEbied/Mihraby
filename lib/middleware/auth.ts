import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/server';
import { JwtPayload, UserRole } from '@/types';

/**
 * Authenticate request by verifying JWT token from Authorization header
 * @throws Error if token is missing or invalid
 */
export async function authenticate(req: NextRequest): Promise<JwtPayload> {
  const authHeader = req.headers.get('authorization');
  const cookieToken = req.cookies.get('auth_token')?.value;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = cookieToken ?? headerToken;
  if (!token) {
    throw new Error('No token provided. Please authenticate.');
  }

  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch {
    throw new Error('Invalid or expired token. Please login again.');
  }
}

/**
 * Higher-order function to protect routes with authentication and role checks
 */
export function withAuth<P = { [key: string]: string }>(
  allowedRoles: UserRole[] | 'all' = 'all',
  handler: (req: NextRequest, context: { user: JwtPayload; params: Promise<P> }) => Promise<Response>
) {
  return async (req: NextRequest, context?: { params: Promise<P> }) => {
    try {
      const user = await authenticate(req);

      // Check role if specific roles are required
      if (allowedRoles !== 'all' && !allowedRoles.includes(user.role)) {
        return Response.json(
          {
            success: false,
            message: 'Forbidden. You do not have permission to access this resource.'
          },
          { status: 403 }
        );
      }

      // Pass params promise as-is to handler (handler will await it)
      const params = context?.params ?? (Promise.resolve({}) as Promise<P>);

      // Call the actual handler with user context
      return handler(req, { user, params });
    } catch (error) {
      return Response.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Authentication failed',
          error: error instanceof Error ? error.message : 'Authentication failed'
        },
        { status: 401 }
      );
    }
  };
}
