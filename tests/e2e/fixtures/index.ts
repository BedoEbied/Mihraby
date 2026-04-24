import { test as base, expect } from '@playwright/test';
import { loginAsStudent, type SeededStudent } from './auth';
import {
  createPendingPaymentBooking,
  deleteBooking,
  type SeededBooking,
} from './booking';

type Fixtures = {
  student: SeededStudent;
  booking: SeededBooking;
};

/**
 * Shared fixtures for PayPal E2E. Order matters: `booking` depends on
 * `student` so the auth fixture resolves first and the DB insert uses the
 * real seeded student id.
 */
// Playwright's fixture callback convention is `async ({...}, use) => await use(value)`.
// We rename the parameter to `provide` so ESLint's react-hooks rule doesn't
// mistake it for a React hook.
export const test = base.extend<Fixtures>({
  student: async ({ page }, provide) => {
    const student = await loginAsStudent(page);
    await provide(student);
  },
  booking: async ({ student }, provide) => {
    const booking = await createPendingPaymentBooking(student.id);
    try {
      await provide(booking);
    } finally {
      await deleteBooking(booking);
    }
  },
});

export { expect };
