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
    // map ORDER_ALREADY_CAPTURED → success), but short-circuiting here saves
    // a network round-trip on retries from the return page.
    if (existing.status === 'confirmed') {
      return NextResponse.json<ApiResponse<{ booking: IBooking }>>({
        success: true,
        data: { booking: existing },
      });
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
