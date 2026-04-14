'use client';

import { use } from 'react';
import Link from 'next/link';
import { useBookingDetail, useCancelBooking } from '@/features/bookings/api';
import type { BookingWithDetails } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { formatInCairo } from '@/lib/time';

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-[var(--color-accent)]/10 text-[var(--color-accent-dark)]',
  pending_review: 'bg-[var(--color-surface)] text-[var(--color-primary)]',
  confirmed: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  cancelled: 'bg-[var(--color-surface-dark)] text-[var(--color-text-muted)]',
  completed: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  no_show: 'bg-[var(--color-error-light)] text-[var(--color-error)]',
};

export default function StudentBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookingId = Number(id);

  const { data: booking, isLoading, error } = useBookingDetail(bookingId);
  const cancel = useCancelBooking();

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading booking…</p>;
  }

  if (error || !booking) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)]">
        <p className="text-[var(--color-error)]">Booking not found.</p>
        <Link href="/student/bookings" className="mt-3 inline-block text-sm text-[var(--color-accent)] hover:underline">
          Back to my bookings
        </Link>
      </div>
    );
  }

  // The API returns BookingWithDetails (joined data); useBookingDetail types as IBooking.
  const b = booking as unknown as BookingWithDetails & { meeting_link?: string };
  const canCancel = b.status === 'pending_payment' || b.status === 'pending_review';
  const isPendingPayment = b.status === 'pending_payment';

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/student/bookings" className="text-sm text-[var(--color-accent)] hover:underline">
          ← My Bookings
        </Link>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] border-s-4 border-s-[var(--color-accent)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)] break-words">
            {b.course_title ?? 'Booking'}
          </h1>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status] ?? ''}`}>
            {b.status.replace(/_/g, ' ')}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-[var(--color-text-muted)]">Session</dt>
          <dd className="text-[var(--color-text)]">
            {b.slot_start_time
              ? formatInCairo(new Date(b.slot_start_time))
              : '—'}
          </dd>

          <dt className="text-[var(--color-text-muted)]">Amount</dt>
          <dd className="text-[var(--color-text)]">{formatPrice(b.amount)}</dd>

          <dt className="text-[var(--color-text-muted)]">Payment</dt>
          <dd className="text-[var(--color-text)] capitalize">{b.payment_method ?? '—'}</dd>

          {b.status === 'confirmed' && b.meeting_link && (
            <>
              <dt className="text-[var(--color-text-muted)]">Meeting</dt>
              <dd>
                <a
                  href={b.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  Join session
                </a>
              </dd>
            </>
          )}

          {b.status === 'confirmed' && !b.meeting_link && (
            <>
              <dt className="text-[var(--color-text-muted)]">Meeting</dt>
              <dd className="text-[var(--color-text-secondary)] italic text-xs">
                Your teacher will send the meeting link by email before the session.
              </dd>
            </>
          )}
        </dl>

        <div className="flex flex-wrap gap-3 pt-2">
          {isPendingPayment && (
            <Link
              href={`/student/bookings/${b.id}/pay`}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-primary)] hover:bg-[var(--color-accent-dark)] transition-colors"
            >
              Complete payment
            </Link>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => cancel.mutate(b.id)}
              disabled={cancel.isPending}
              className="rounded-lg border border-[var(--color-error)] px-4 py-2 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error-light)] disabled:opacity-50 transition-colors"
            >
              {cancel.isPending ? 'Cancelling…' : 'Cancel booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
