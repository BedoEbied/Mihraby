import { describe, it, expect, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';

vi.mock('@/lib/auth/server', () => ({
  verifyToken: vi.fn(() => ({ userId: 1, role: 'admin', email: 'a@example.com' })),
}));

type MockRequest = {
  headers: { get: (key: string) => string | undefined };
  cookies: { get: (key: string) => { value: string } | undefined };
};

const makeRequest = (headers: Record<string, string>, cookies: Record<string, string> = {}): MockRequest =>
  ({
    headers: {
      get: (key: string) => headers[key.toLowerCase()],
    },
    cookies: {
      get: (key: string) => (cookies[key] ? { value: cookies[key] } : undefined),
    },
  });

describe('authenticate middleware', () => {
  it('uses cookie token when present', async () => {
    const req = makeRequest({}, { auth_token: 'cookie-token' });
    const user = await authenticate(req as unknown as NextRequest);
    expect(user.userId).toBe(1);
  });

  it('uses Authorization header token when cookie missing', async () => {
    const req = makeRequest({ authorization: 'Bearer header-token' });
    const user = await authenticate(req as unknown as NextRequest);
    expect(user.userId).toBe(1);
  });

  it('throws when missing token', async () => {
    const req = makeRequest({});
    await expect(authenticate(req as unknown as NextRequest)).rejects.toThrow('No token provided');
  });
});
