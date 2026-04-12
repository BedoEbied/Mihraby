import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { BookingService } from '@/lib/services/bookingService';
import { initiateBookingSchema } from '@/lib/validators/booking';
import { ApiResponse, UserRole, IBooking, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<Record<string, string>> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const body = await req.json();
    const validated = initiateBookingSchema.parse(body);

    const booking = await BookingService.initiateBooking(
      context.user.userId,
      validated
    );

    return NextResponse.json<ApiResponse<IBooking>>(
      { success: true, message: 'Booking created — proceed to payment', data: booking },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Initiate booking error:`, error);
    return handleApiError(error, requestId);
  }
}

export const POST = withAuth([UserRole.STUDENT], handler);
