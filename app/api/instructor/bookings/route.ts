import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { BookingService } from '@/lib/services/bookingService';
import { ApiResponse, UserRole, BookingWithDetails, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<Record<string, string>> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const bookings = await BookingService.listForInstructor(context.user.userId);

    return NextResponse.json<ApiResponse<{ bookings: BookingWithDetails[]; count: number }>>({
      success: true,
      data: { bookings, count: bookings.length },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] List instructor bookings error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], handler);
