import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/services/bookingService';

export async function GET(req: NextRequest) {
  if (process.env.PAYMOB_API_KEY) {
    return NextResponse.json({ success: false, message: 'Not available' }, { status: 404 });
  }

  const url = new URL(req.url);
  const bookingId = Number(url.searchParams.get('bookingId'));
  const returnUrl = url.searchParams.get('returnUrl') || '/student/bookings';

  if (!bookingId || !Number.isFinite(bookingId)) {
    return NextResponse.json({ success: false, message: 'Missing bookingId' }, { status: 400 });
  }

  try {
    await BookingService.confirmBooking(bookingId, {
      payment_id: `mock_pay_${bookingId}`,
      transaction_id: `mock_txn_${bookingId}_${Date.now()}`,
    });
  } catch (error) {
    console.error('[mock-confirm] Error confirming booking:', error);
  }

  return NextResponse.redirect(new URL(returnUrl, req.url));
}
