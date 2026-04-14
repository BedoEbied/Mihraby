import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { AuthService } from '@/lib/services/authService';
import { verifyToken } from '@/lib/auth/server';
import { UserRole, UserWithoutPassword } from '@/types';

const AUTH_COOKIE = 'auth_token';

// Wrapped in React cache() to deduplicate within a single request.
// Layout and page can both call getSessionUser() without hitting the DB twice.
export const getSessionUser = cache(async function getSessionUser(): Promise<UserWithoutPassword | null> {
  noStore();
  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(AUTH_COOKIE)?.value;
  } catch (err) {
    console.error('Unable to read cookies', err);
    const headerList = await headers();
    const authHeader = headerList.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    return await AuthService.getCurrentUser(decoded.userId);
  } catch (err) {
    console.error('Session decode failed', err);
    return null;
  }
});

export async function requireRole(allowed: UserRole[]) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (!allowed.includes(user.role)) {
    redirect('/unauthorized');
  }
  return user;
}
