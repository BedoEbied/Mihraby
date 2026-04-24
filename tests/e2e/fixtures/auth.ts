import type { Page } from '@playwright/test';

export type SeededStudent = { id: number; email: string };

/**
 * Log in as a seeded student via the real /api/auth/login route. Cookies set
 * on `page.request` propagate to the browser context, so subsequent
 * `page.goto(...)` calls are authenticated.
 *
 * Requires `yarn db:seed` to have run — that inserts `student1@example.com`
 * with a real bcrypt hash of `password123`.
 */
export async function loginAsStudent(
  page: Page,
  email = 'student1@example.com',
  password = 'password123'
): Promise<SeededStudent> {
  const res = await page.request.post('/api/auth/login', {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(
      `E2E login failed (${res.status()}): ${await res.text()}. ` +
        `Did you run \`yarn db:seed\`?`
    );
  }
  const body = (await res.json()) as {
    success?: boolean;
    data?: { user?: { id?: number; email?: string } };
  };
  const user = body?.data?.user;
  if (!body?.success || !user?.id || !user?.email) {
    throw new Error(`E2E login returned unexpected shape: ${JSON.stringify(body)}`);
  }
  return { id: user.id, email: user.email };
}
