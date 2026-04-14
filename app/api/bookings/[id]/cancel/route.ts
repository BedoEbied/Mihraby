import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { BookingService } from '@/lib/services/bookingService';
import { bookingIdSchema } from '@/lib/validators/booking';
import { ApiResponse, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { id } = await context.params;
    const { id: bookingId } = bookingIdSchema.parse({ id });

    await BookingService.cancelBooking(
      bookingId,
      context.user.userId,
      context.user.role
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Booking cancelled',
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Cancel booking error:`, error);
    return handleApiError(error, requestId);
  }
}

export const PUT = withAuth('all', handler);
