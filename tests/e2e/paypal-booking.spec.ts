import { test, expect } from './fixtures';
import { fetchBookingSnapshot } from './fixtures/booking';

test('student completes a PayPal booking via the pay → return flow', async ({
  page,
  booking,
}) => {
  // /pay auto-initiates checkout once the booking detail loads, then
  // window.location.assign(redirectUrl) — the mock rewrites that approve
  // link to loop the browser straight back to /return with a token.
  await page.goto(`/student/bookings/${booking.id}/pay`);

  await page.waitForURL(
    new RegExp(`/student/bookings/${booking.id}/return\\?token=ORDER_${booking.id}_\\d+`),
    { timeout: 20_000 }
  );

  await expect(page.getByText(/Session confirmed/i)).toBeVisible({ timeout: 15_000 });

  const snapshot = await fetchBookingSnapshot(booking.id);
  expect(snapshot).not.toBeNull();
  expect(snapshot!.status).toBe('confirmed');
  expect(snapshot!.payment_method).toBe('paypal');
  expect(snapshot!.payment_id).toMatch(new RegExp(`^ORDER_${booking.id}_`));
  expect(snapshot!.transaction_id).toBe(`CAPTURE_${booking.id}`);
});
