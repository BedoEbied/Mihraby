import { NextRequest, NextResponse } from 'next/server';
import { getPaymentGateway } from '@/lib/composition';
import { BookingService } from '@/lib/services/bookingService';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') ?? 'webhook';
  try {
    const rawBody = await req.text();
    const gateway = getPaymentGateway();
    const headers = Object.fromEntries(req.headers);
    if (!gateway.verifyWebhook(rawBody, headers)) {
      console.error(`[${requestId}] Paymob webhook: HMAC verification failed`);
      return NextResponse.json<ApiResponse>(
        { success: false, message: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = gateway.parseWebhookEvent(payload);

    if (!event.success) {
      console.warn(`[${requestId}] Paymob webhook: payment failed for booking ${event.bookingId}`);
      return NextResponse.json<ApiResponse>({ success: true, message: 'Payment failure noted' });
    }

    await BookingService.confirmBooking(event.bookingId, {
      payment_id: event.transactionId,
      transaction_id: event.transactionId,
    });

    console.log(`[${requestId}] Paymob webhook: booking ${event.bookingId} confirmed`);
    return NextResponse.json<ApiResponse>({ success: true, message: 'Booking confirmed' });
  } catch (error) {
    console.error(`[${requestId}] Paymob webhook error:`, error);
    return NextResponse.json<ApiResponse>({ success: true, message: 'Processed' });
  }
}
