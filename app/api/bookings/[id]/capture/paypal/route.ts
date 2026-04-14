import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { getPaymentGateway } from '@/lib/composition';
import { Booking } from '@/lib/db/models/Booking';
import { BookingService } from '@/lib/services/bookingService';
import { bookingIdSchema } from '@/lib/validators/booking';
import { capturePaypalSchema } from '@/lib/validators/payment';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';
import { UserRole } from '@/types';
import type { ApiResponse, IBooking, JwtPayload } from '@/types';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { id } = await context.params;
    const { id: bookingId } = bookingIdSchema.parse({ id });

    const body = await req.json().catch(() => ({}));
    const { orderId } = capturePaypalSchema.parse(body);

    const existing = await Booking.findById(bookingId);
    if (!existing) {
      throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
    }
    if (existing.user_id !== context.user.userId) {
      throw new ApiError('Not authorized', 403, ApiErrorCode.FORBIDDEN);
    }

    // Belt-and-braces idempotency: PayPal capture itself is idempotent (we
    // map ORDER_ALREADY_CAPTURED → re-fetched capture), but short-circuiting
    // here saves a network round-trip on retries from the return page.
    if (existing.status === 'confirmed') {
      return NextResponse.json<ApiResponse<{ booking: IBooking }>>({
        success: true,
        data: { booking: existing },
      });
    }

    // The orderId submitted from /return MUST match the one we stamped on
    // this booking at checkout initiation. Without this check, a student
    // could confirm an expensive booking by replaying a cheap booking's
    // PayPal order id.
    if (existing.payment_method !== 'paypal') {
      throw new ApiError(
        `Booking is not a PayPal booking (payment_method='${existing.payment_method}')`,
        400,
        ApiErrorCode.VALIDATION_ERROR
      );
    }
    if (existing.status !== 'pending_payment') {
      throw new ApiError(
        `Cannot capture a booking with status '${existing.status}'`,
        400,
        ApiErrorCode.VALIDATION_ERROR
      );
    }
    if (!existing.payment_id || existing.payment_id !== orderId) {
      throw new ApiError(
        'PayPal order id does not match this booking',
        403,
        ApiErrorCode.FORBIDDEN
      );
    }

    const gateway = getPaymentGateway();
    if (gateway.name !== 'paypal' || !gateway.captureOrder) {
      throw new ApiError(
        `PayPal capture is unavailable (active gateway: '${gateway.name}')`,
        500,
        ApiErrorCode.SERVER_ERROR
      );
    }

    const result = await gateway.captureOrder(orderId, bookingId);
    if (!result.success) {
      throw new ApiError('PayPal capture did not succeed', 502, ApiErrorCode.SERVER_ERROR);
    }

    // Amount parity check: compare in cents to avoid float drift. If PayPal
    // captured a different amount than the booking's quoted price, refuse
    // to confirm — the booking stays pending_payment and an operator can
    // investigate / refund via the PayPal dashboard.
    const expectedCents = Math.round(Number(existing.amount) * 100);
    const capturedCents = Math.round(result.amount * 100);
    if (expectedCents !== capturedCents) {
      throw new ApiError(
        `PayPal captured amount (${result.amount}) does not match booking amount (${existing.amount})`,
        502,
        ApiErrorCode.SERVER_ERROR
      );
    }

    const confirmed = await BookingService.confirmBooking(bookingId, {
      payment_id: orderId,
      transaction_id: result.transactionId,
    });

    return NextResponse.json<ApiResponse<{ booking: IBooking }>>({
      success: true,
      data: { booking: confirmed },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] PayPal capture error:`, error);
    return handleApiError(error, requestId);
  }
}

export const POST = withAuth([UserRole.STUDENT], handler);
