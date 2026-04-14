import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { BookingService } from '@/lib/services/bookingService';
import { ApiResponse, BookingStatus, BookingWithDetails, UserRole } from '@/types';
import { handleApiError } from '@/lib/api/errors';

async function handler(
  req: NextRequest
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const url = new URL(req.url);
    const status = (url.searchParams.get('status') ?? undefined) as BookingStatus | undefined;
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1;
    const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 50;
    const offset = (normalizedPage - 1) * normalizedLimit;

    const bookings = await BookingService.listForAdmin({
      status,
      limit: normalizedLimit,
      offset,
    });

    return NextResponse.json<ApiResponse<{ bookings: BookingWithDetails[]; count: number }>>({
      success: true,
      data: { bookings, count: bookings.length },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] List admin bookings error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth([UserRole.ADMIN], handler);
