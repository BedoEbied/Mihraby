import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { Booking } from '@/lib/db/models/Booking';
import { bookingIdSchema } from '@/lib/validators/booking';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';
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

    return NextResponse.json<ApiResponse<{ status: string; payment_status: string }>>({
      success: true,
      data: { status: booking.status, payment_status: booking.payment_status },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Pay status error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth([UserRole.STUDENT], handler);
