'use server';

import { cookies } from 'next/headers';
import { AuthService } from '@/lib/services/authService';
import { verifyToken } from '@/lib/auth/server';
import { registerSchema, loginSchema } from '@/lib/validators/auth';
import { UserWithoutPassword } from '@/types';

const AUTH_COOKIE = 'auth_token';
const commonCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export async function registerAction(formData: FormData) {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    };

    const validatedData = registerSchema.parse(data);
    const result = await AuthService.register(validatedData);

    (await cookies()).set(AUTH_COOKIE, result.token, commonCookieOptions);

    return { success: true, data: { user: result.user } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

export async function loginAction(formData: FormData) {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const validatedData = loginSchema.parse(data);
    const result = await AuthService.login(validatedData.email, validatedData.password);

    (await cookies()).set(AUTH_COOKIE, result.token, commonCookieOptions);

    return { success: true, data: { user: result.user } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

export async function getCurrentUserAction(): Promise<{
  success: boolean;
  data?: UserWithoutPassword;
  error?: string;
}> {
  try {
    const token = (await cookies()).get(AUTH_COOKIE)?.value;

    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const decoded = verifyToken(token);
    const user = await AuthService.getCurrentUser(decoded.userId);

    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user',
    };
  }
}
