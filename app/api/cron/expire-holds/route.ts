import { NextRequest, NextResponse } from 'next/server';
import { Booking } from '@/lib/db/models/Booking';
import { BookingService } from '@/lib/services/bookingService';
import { UserRole } from '@/types';
import type { ApiResponse } from '@/types';

const HOLD_TIMEOUT_MINUTES = 30;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron/expire-holds] CRON_SECRET not configured');
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Cron not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const cutoff = new Date(Date.now() - HOLD_TIMEOUT_MINUTES * 60 * 1000);
    const expired = await Booking.findPendingOlderThan(cutoff);

    let cancelledCount = 0;
    for (const booking of expired) {
      try {
        await BookingService.cancelBooking(booking.id, 0, UserRole.ADMIN);
        cancelledCount++;
      } catch (err) {
        console.error(`[cron/expire-holds] Failed to cancel booking ${booking.id}:`, err);
      }
    }

    console.log(`[cron/expire-holds] Expired ${cancelledCount}/${expired.length} holds`);
    return NextResponse.json<ApiResponse<{ expired: number }>>({
      success: true,
      data: { expired: cancelledCount },
    });
  } catch (error) {
    console.error('[cron/expire-holds] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: 'Internal error' },
      { status: 500 }
    );
  }
}
