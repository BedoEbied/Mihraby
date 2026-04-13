'use client';

import { use } from 'react';
import Link from 'next/link';
import { useBookingPayStatus } from '@/features/bookings/api';

export default function BookingReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookingId = Number(id);
  const { data, isLoading, error } = useBookingPayStatus(bookingId);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-text-secondary)]">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-light)] p-6 text-center shadow-[var(--shadow-sm)]">
        <p className="text-[var(--color-error)]">We couldn&apos;t verify your payment. Your booking may still be processing.</p>
        <Link href="/student/bookings" className="mt-4 inline-block text-[var(--color-accent)] hover:text-[var(--color-accent-light)] hover:underline">
          Go to My Bookings
        </Link>
      </div>
    );
  }

  if (data.status === 'confirmed') {
    return (
      <div className="rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success-light)] p-6 text-center shadow-[var(--shadow-sm)]">
        <h2 className="text-xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)]">Payment Successful!</h2>
        <p className="mt-2 text-[var(--color-success)]">Your session is booked. You&apos;ll receive a meeting link before it starts.</p>
        <Link
          href="/student/bookings"
          className="mt-4 inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)]"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  if (data.status === 'cancelled') {
    return (
      <div className="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-light)] p-6 text-center shadow-[var(--shadow-sm)]">
        <h2 className="text-xl font-bold text-[var(--color-error)] font-[family-name:var(--font-heading)]">Payment Not Completed</h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">The payment was not completed. You can try booking again.</p>
        <Link
          href="/student/courses"
          className="mt-4 inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)]"
        >
          Browse Courses
        </Link>
      </div>
    );
  }

  // Still pending — spinner continues via refetchInterval
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      <p className="mt-4 text-[var(--color-text-secondary)]">Verifying your payment...</p>
    </div>
  );
}
