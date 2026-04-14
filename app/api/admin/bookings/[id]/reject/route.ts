import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { Booking } from '@/lib/db/models/Booking';
import { withTransaction } from '@/lib/db/transaction';
import { BookingService } from '@/lib/services/bookingService';
import { bookingIdSchema, rejectBookingSchema } from '@/lib/validators/booking';
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
    const body = rejectBookingSchema.parse(await req.json());

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
    }
    if (booking.status !== 'pending_review') {
      throw new ApiError('Only pending-review bookings can be rejected', 400, ApiErrorCode.VALIDATION_ERROR);
    }

    const updated = await BookingService.cancelBooking(
      bookingId,
      context.user.userId,
      context.user.role
    );

    await withTransaction(async (conn) => {
      await Booking.updateFields(conn, bookingId, {
        admin_notes: body.reason,
      });
    });

    return NextResponse.json<ApiResponse<IBooking>>({
      success: true,
      message: 'Booking rejected successfully',
      data: {
        ...updated,
        admin_notes: body.reason,
      },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Reject booking error:`, error);
    return handleApiError(error, requestId);
  }
}

export const POST = withAuth([UserRole.ADMIN], handler);
