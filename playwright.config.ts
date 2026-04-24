import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const mockPaypalPort = Number(process.env.MOCK_PAYPAL_PORT || 3001);
const mockPaypalBase = `http://127.0.0.1:${mockPaypalPort}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Two servers: the Mihraby Next.js app + a local mock of PayPal's REST API.
  // PayPalGateway honors PAYPAL_API_BASE as a test-only escape hatch and
  // routes all its server-side fetch calls through the mock.
  webServer: [
    {
      command: 'node tests/e2e/fixtures/mock-paypal-server.mjs',
      url: `${mockPaypalBase}/v1/oauth2/token`,
      // The mock server returns 404 for GET on the OAuth endpoint (it only
      // handles POST), which Playwright's webServer happily accepts as "up".
      // Alternatively we could add a /healthz handler, but this is zero extra
      // code and is sufficient for readiness detection.
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        MOCK_PAYPAL_PORT: String(mockPaypalPort),
        MOCK_PAYPAL_APP_URL: baseURL,
      },
    },
    {
      // In CI we run the production build — `next dev` is flakier under
      // constrained resources and we want to catch production-only issues.
      command: process.env.CI ? 'yarn build && yarn start -p 3000' : 'yarn dev -p 3000',
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        // Must equal `baseURL` exactly — PayPalGateway bakes this into
        // `return_url` and the mock's approve link redirects back here.
        NEXT_PUBLIC_APP_URL: baseURL,
        PAYPAL_ENV: process.env.PAYPAL_ENV || 'sandbox',
        PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || 'test_client_id',
        PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || 'test_client_secret',
        // Redirect all PayPal REST traffic to the mock.
        PAYPAL_API_BASE: mockPaypalBase,
      },
    },
  ],
});
