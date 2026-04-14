'use client';

import { useInstructorBookings } from '@/features/bookings/api';
import { formatPrice } from '@/lib/format';
import { formatInCairo } from '@/lib/time';
import type { BookingWithDetails } from '@/lib/types';

function formatDate(value: Date | string): string {
  return formatInCairo(new Date(value));
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
  return (
    <li className="rounded-xl border border-[var(--color-border)] border-s-4 border-s-[var(--color-accent)] bg-[var(--color-bg-white)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[var(--color-text)] font-[family-name:var(--font-heading)] truncate">
            {booking.course_title}
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            {formatDate(booking.slot_start_time)} &ndash; {formatDate(booking.slot_end_time)}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] truncate">
            Student: {booking.student_name}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {formatPrice(booking.amount)} &middot; {booking.payment_method ?? '—'}
          </p>
        </div>
        <span
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
            STATUS_STYLES[booking.status] ?? 'bg-[var(--color-surface)]'
          }`}
        >
          {booking.status.replace(/_/g, ' ')}
        </span>
      </div>
    </li>
  );
}

export default function InstructorBookings() {
  const { data: bookings = [], isLoading, error } = useInstructorBookings();

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading sessions…</p>;
  }
  if (error) {
    return <p className="text-sm text-[var(--color-error)]">Failed to load sessions.</p>;
  }
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 text-center shadow-[var(--shadow-sm)]">
        <p className="text-[var(--color-text-muted)]">
          No sessions yet. Once students book your courses, they will appear here.
        </p>
      </div>
    );
  }

  const upcoming = bookings.filter((b) =>
    ['pending_payment', 'pending_review', 'confirmed'].includes(b.status)
  );
  const past = bookings.filter((b) =>
    ['completed', 'cancelled', 'no_show'].includes(b.status)
  );

  return (
    <div className="space-y-8">
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold tracking-widest uppercase text-[var(--color-accent)] mb-3">
            Upcoming
          </h2>
          <ul className="space-y-3">
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b as BookingWithDetails} />
            ))}
          </ul>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
            Past
          </h2>
          <ul className="space-y-3">
            {past.map((b) => (
              <BookingRow key={b.id} booking={b as BookingWithDetails} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
