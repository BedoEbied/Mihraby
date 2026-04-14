import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { getPaymentGateway } from '@/lib/composition';
import { Booking } from '@/lib/db/models/Booking';
import { User } from '@/lib/db/models/User';
import { bookingIdSchema } from '@/lib/validators/booking';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';
import { withTransaction } from '@/lib/db/transaction';
import { UserRole } from '@/types';
import type { ApiResponse, JwtPayload } from '@/types';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { id } = await context.params;
    const { id: bookingId } = bookingIdSchema.parse({ id });

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
    }
    if (booking.user_id !== context.user.userId) {
      throw new ApiError('Not authorized', 403, ApiErrorCode.FORBIDDEN);
    }
    if (booking.status !== 'pending_payment') {
      throw new ApiError(
        `Cannot pay for a booking with status '${booking.status}'`,
        400,
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    const student = await User.findById(context.user.userId);
    if (!student) {
      throw new ApiError('Student not found', 404, ApiErrorCode.NOT_FOUND);
    }

    const gateway = getPaymentGateway();
    if (gateway.name !== 'paypal') {
      throw new ApiError(
        `PayPal gateway is not active (got '${gateway.name}'). Set PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET.`,
        500,
        ApiErrorCode.SERVER_ERROR
      );
    }

    const session = await gateway.createCheckoutSession(booking, student, {
      method: 'paypal',
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/student/bookings/${bookingId}/return`,
    });

    await withTransaction(async (conn) => {
      await Booking.updateFields(conn, bookingId, {
        payment_method: 'paypal',
        payment_id: session.providerSessionId,
      });
    });

    return NextResponse.json<ApiResponse<{ redirectUrl: string; orderId: string }>>({
      success: true,
      data: {
        redirectUrl: session.redirectUrl,
        orderId: session.providerSessionId,
      },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] PayPal pay error:`, error);
    return handleApiError(error, requestId);
  }
}

export const POST = withAuth([UserRole.STUDENT], handler);
