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
    const url = new URL(req.url);
    const statusParam = url.searchParams.get('status') ?? undefined;

    const statusMap: Record<string, string> = {
      upcoming: 'confirmed',
      pending: 'pending_payment',
    };
    const dbStatus = statusParam && statusParam !== 'all'
      ? (statusMap[statusParam] ?? statusParam) as Parameters<typeof BookingService.listForStudent>[1]
      : undefined;

    const bookings = await BookingService.listForStudent(
      context.user.userId,
      dbStatus
    );

    return NextResponse.json<ApiResponse<{ bookings: BookingWithDetails[]; count: number }>>({
      success: true,
      data: { bookings, count: bookings.length },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] List student bookings error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth([UserRole.STUDENT], handler);
