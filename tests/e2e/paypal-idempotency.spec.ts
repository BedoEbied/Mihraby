import { test, expect } from './fixtures';
import { fetchBookingSnapshot } from './fixtures/booking';

test('hitting the PayPal return URL twice keeps the booking confirmed', async ({
  page,
  booking,
}) => {
  // First round: full pay → return → capture → confirmed.
  await page.goto(`/student/bookings/${booking.id}/pay`);
  await page.waitForURL(
    new RegExp(`/student/bookings/${booking.id}/return\\?token=ORDER_${booking.id}_\\d+`),
    { timeout: 20_000 }
  );
  await expect(page.getByText(/Session confirmed/i)).toBeVisible({ timeout: 15_000 });

  const afterFirst = await fetchBookingSnapshot(booking.id);
  expect(afterFirst?.status).toBe('confirmed');
  expect(afterFirst?.transaction_id).toBe(`CAPTURE_${booking.id}`);
  const returnUrl = page.url();

  // Second round: hit the same return URL again. The capture route short-
  // circuits because existing.status === 'confirmed' (see
  // app/api/bookings/[id]/capture/paypal/route.ts), so no new PayPal call
  // is made and the user still sees the success card.
  await page.goto(returnUrl);
  await expect(page.getByText(/Session confirmed/i)).toBeVisible({ timeout: 15_000 });

  const afterSecond = await fetchBookingSnapshot(booking.id);
  expect(afterSecond?.status).toBe('confirmed');
  expect(afterSecond?.transaction_id).toBe(afterFirst?.transaction_id);
});
