import { ApiError, ApiErrorCode } from '@/lib/api/errors';
import { getFileStorage } from '@/lib/composition';
import { withTransaction } from '@/lib/db/transaction';
import { Booking } from '@/lib/db/models/Booking';
import type { IBooking } from '@/types';

const MAX_PAYMENT_PROOF_BYTES = 5 * 1024 * 1024;

type ValidatedPaymentProof = {
  bytes: Buffer;
  contentType: 'image/png' | 'image/jpeg' | 'image/webp';
};

export class InstapayService {
  static readonly MAX_PAYMENT_PROOF_BYTES = MAX_PAYMENT_PROOF_BYTES;

  static async submitProof(
    bookingId: number,
    userId: number,
    file: File,
    transactionReference: string
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
    }
    if (booking.user_id !== userId) {
      throw new ApiError('Not authorized to upload proof for this booking', 403, ApiErrorCode.FORBIDDEN);
    }
    if (booking.status !== 'pending_review') {
      throw new ApiError('Payment proof can only be uploaded while the booking is pending review', 400, ApiErrorCode.VALIDATION_ERROR);
    }
    if (booking.payment_method !== 'instapay') {
      throw new ApiError('Payment proof is only supported for InstaPay bookings', 400, ApiErrorCode.VALIDATION_ERROR);
    }

    const validated = await validatePaymentProofFile(file);
    const storage = getFileStorage();

    return withTransaction(async (conn) => {
      const current = await Booking.lockById(conn, bookingId);
      if (!current) {
        throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
      }
      if (current.user_id !== userId) {
        throw new ApiError('Not authorized to upload proof for this booking', 403, ApiErrorCode.FORBIDDEN);
      }
      if (current.status !== 'pending_review') {
        throw new ApiError('Payment proof can only be uploaded while the booking is pending review', 400, ApiErrorCode.VALIDATION_ERROR);
      }

      if (current.payment_proof_path) {
        await storage.delete(current.payment_proof_path);
      }

      const paymentProofPath = await storage.save({
        namespace: 'payment-proofs',
        originalFilename: file.name,
        contentType: validated.contentType,
        data: validated.bytes,
        metadata: { bookingId: String(bookingId) },
      });

      await Booking.updateFields(conn, bookingId, {
        instapay_reference: transactionReference,
        payment_proof_path: paymentProofPath,
        payment_proof_uploaded_at: new Date(),
      });

      const updated = await Booking.findById(bookingId, conn);
      if (!updated) {
        throw new ApiError('Failed to load booking after proof upload', 500);
      }
      return updated;
    });
  }
}

export async function validatePaymentProofFile(file: File): Promise<ValidatedPaymentProof> {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new ApiError('Payment proof file is required', 400, ApiErrorCode.VALIDATION_ERROR);
  }
  if (file.size > MAX_PAYMENT_PROOF_BYTES) {
    throw new ApiError('Payment proof must be 5 MB or smaller', 400, ApiErrorCode.VALIDATION_ERROR);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = detectPaymentProofMime(bytes);

  if (!contentType) {
    throw new ApiError(
      'Unsupported payment proof file. Use PNG, JPEG, or WEBP.',
      400,
      ApiErrorCode.VALIDATION_ERROR
    );
  }

  return { bytes, contentType };
}

function detectPaymentProofMime(
  bytes: Buffer
): ValidatedPaymentProof['contentType'] | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export default InstapayService;
