import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { BookingService } from '@/lib/services/bookingService';
import { bookingIdSchema } from '@/lib/validators/booking';
import { ApiResponse, IBooking, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { id } = await context.params;
    const { id: bookingId } = bookingIdSchema.parse({ id });

    const booking = await BookingService.getBookingById(
      bookingId,
      context.user.userId,
      context.user.role
    );

    return NextResponse.json<ApiResponse<IBooking>>({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Get booking error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth('all', handler);
