import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { Booking } from '@/lib/db/models/Booking';
import { BookingService } from '@/lib/services/bookingService';
import { bookingIdSchema } from '@/lib/validators/booking';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';
import { ApiResponse, IBooking, JwtPayload, UserRole } from '@/types';

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
    if (booking.status !== 'pending_review') {
      throw new ApiError('Only pending-review bookings can be approved', 400, ApiErrorCode.VALIDATION_ERROR);
    }

    const updated = await BookingService.confirmBooking(bookingId);

    return NextResponse.json<ApiResponse<IBooking>>({
      success: true,
      message: 'Booking approved successfully',
      data: updated,
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Approve booking error:`, error);
    return handleApiError(error, requestId);
  }
}

export const POST = withAuth([UserRole.ADMIN], handler);
