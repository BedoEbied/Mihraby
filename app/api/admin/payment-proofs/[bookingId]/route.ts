import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { withAuth } from '@/lib/middleware/auth';
import { getFileStorage } from '@/lib/composition';
import { Booking } from '@/lib/db/models/Booking';
import { bookingIdSchema } from '@/lib/validators/booking';
import { ApiError, ApiErrorCode, handleApiError } from '@/lib/api/errors';
import { JwtPayload, UserRole } from '@/types';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ bookingId: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { bookingId } = await context.params;
    const { id } = bookingIdSchema.parse({ id: bookingId });

    const booking = await Booking.findById(id);
    if (!booking) {
      throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
    }
    if (!booking.payment_proof_path) {
      throw new ApiError('Payment proof not found', 404, ApiErrorCode.NOT_FOUND);
    }

    const file = await getFileStorage().read(booking.payment_proof_path);
    return new NextResponse(Readable.toWeb(file.stream) as ReadableStream, {
      headers: {
        'Content-Type': file.contentType,
        'Content-Length': String(file.contentLength),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Stream payment proof error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth([UserRole.ADMIN], handler);
