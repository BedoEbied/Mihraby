import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { getPaymentGateway } from '@/lib/composition';
import { Booking } from '@/lib/db/models/Booking';
import { User } from '@/lib/db/models/User';
import { bookingIdSchema } from '@/lib/validators/booking';
import { createCheckoutSchema } from '@/lib/validators/payment';
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
    const body = await req.json();
    const { payment_method } = createCheckoutSchema.parse(body);

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

    const origin = req.headers.get('origin') || req.headers.get('host') || 'http://localhost:3000';
    const protocol = origin.startsWith('http') ? '' : 'http://';
    const returnUrl = `${protocol}${origin}/student/bookings/${bookingId}/return`;

    const gateway = getPaymentGateway();
    const session = await gateway.createCheckoutSession(booking, student, {
      method: payment_method,
      returnUrl,
    });

    await withTransaction(async (conn) => {
      await Booking.updateFields(conn, bookingId, {
        payment_id: session.providerSessionId,
      });
    });

    return NextResponse.json<ApiResponse<{ redirectUrl: string }>>({
      success: true,
      data: { redirectUrl: session.redirectUrl },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Create checkout error:`, error);
    return handleApiError(error, requestId);
  }
}

export const POST = withAuth([UserRole.STUDENT], handler);
