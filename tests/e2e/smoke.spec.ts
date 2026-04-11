import { test, expect } from '@playwright/test';

test.describe('Smoke flows', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mihraby/i);
  });
});
