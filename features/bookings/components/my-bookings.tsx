'use client';

import Link from 'next/link';
import { useMyBookings, useCancelBooking } from '@/features/bookings/api';
import type { BookingWithDetails } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { formatInCairo } from '@/lib/time';

function formatDate(d: Date | string): string {
  return formatInCairo(new Date(d));
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-[var(--color-accent)]/10 text-[var(--color-accent-dark)]',
  pending_review: 'bg-[var(--color-surface)] text-[var(--color-primary)]',
  confirmed: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  cancelled: 'bg-[var(--color-surface-dark)] text-[var(--color-text-muted)]',
  completed: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  no_show: 'bg-[var(--color-error-light)] text-[var(--color-error)]',
};

function BookingRow({ booking }: { booking: BookingWithDetails }) {
  const cancel = useCancelBooking();
  const canCancel = booking.status === 'pending_payment' || booking.status === 'pending_review';

  return (
    <li className="rounded-xl border border-[var(--color-border)] border-s-4 border-s-[var(--color-accent)] bg-[var(--color-bg-white)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/student/bookings/${booking.id}`} className="font-medium text-[var(--color-text)] font-[family-name:var(--font-heading)] truncate hover:text-[var(--color-accent)] transition-colors">
            {booking.course_title}
          </Link>
          <p className="text-sm text-[var(--color-text-muted)]">
            {formatDate(booking.slot_start_time)} &ndash; {formatDate(booking.slot_end_time)}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] truncate">
            Instructor: {booking.instructor_name}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {formatPrice(booking.amount)} &middot; {booking.payment_method ?? 'not set'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[booking.status] ?? 'bg-[var(--color-surface)]'}`}>
            {booking.status.replace('_', ' ')}
          </span>
          {canCancel && (
            <button
              type="button"
              onClick={() => cancel.mutate(booking.id)}
              disabled={cancel.isPending}
              className="text-sm text-[var(--color-error)] hover:underline disabled:opacity-50 transition-colors px-2 py-1.5"
            >
              {cancel.isPending ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function MyBookings() {
  const { data: bookings = [], isLoading, error } = useMyBookings();

  if (isLoading) return <p className="text-sm text-[var(--color-text-muted)]">Loading bookings...</p>;
  if (error) return <p className="text-sm text-[var(--color-error)]">Failed to load bookings</p>;

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-sm)]">
        <p className="text-[var(--color-text-muted)]">You have no bookings yet. Browse courses to book your first session.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {bookings.map((b) => (
        <BookingRow key={b.id} booking={b as BookingWithDetails} />
      ))}
    </ul>
  );
}
