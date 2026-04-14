import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { InstapayService } from '@/lib/services/instapayService';
import { bookingIdSchema, submitInstapayProofSchema } from '@/lib/validators/booking';
import { ApiResponse, JwtPayload, UserRole, IBooking } from '@/types';
import { handleApiError, ApiError, ApiErrorCode } from '@/lib/api/errors';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (contentLength > InstapayService.MAX_PAYMENT_PROOF_BYTES) {
      throw new ApiError('Payment proof must be 5 MB or smaller', 400, ApiErrorCode.VALIDATION_ERROR);
    }

    const { id } = await context.params;
    const { id: bookingId } = bookingIdSchema.parse({ id });

    const formData = await req.formData();
    const transaction_reference = String(formData.get('transaction_reference') ?? '');
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new ApiError('Payment proof file is required', 400, ApiErrorCode.VALIDATION_ERROR);
    }

    const validated = submitInstapayProofSchema.parse({ transaction_reference });
    const booking = await InstapayService.submitProof(
      bookingId,
      context.user.userId,
      file,
      validated.transaction_reference
    );

    return NextResponse.json<ApiResponse<IBooking>>({
      success: true,
      message: 'Payment proof uploaded successfully',
      data: booking,
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Upload payment proof error:`, error);
    return handleApiError(error, requestId);
  }
}

export const POST = withAuth([UserRole.STUDENT], handler);
