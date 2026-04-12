'use client';

import { useMyBookings, useCancelBooking } from '@/features/bookings/api';
import type { BookingWithDetails } from '@/lib/types';

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-800',
  pending_review: 'bg-purple-100 text-purple-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-800',
  no_show: 'bg-red-100 text-red-800',
};

function BookingRow({ booking }: { booking: BookingWithDetails }) {
  const cancel = useCancelBooking();
  const canCancel = booking.status === 'pending_payment' || booking.status === 'pending_review';

  return (
    <li className="rounded border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{booking.course_title}</p>
          <p className="text-sm text-gray-500">
            {formatDate(booking.slot_start_time)} &ndash; {formatDate(booking.slot_end_time)}
          </p>
          <p className="text-sm text-gray-500">
            Instructor: {booking.instructor_name}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {Number(booking.amount)} EGP &middot; {booking.payment_method ?? 'not set'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[booking.status] ?? 'bg-gray-100'}`}>
            {booking.status.replace('_', ' ')}
          </span>
          {canCancel && (
            <button
              type="button"
              onClick={() => cancel.mutate(booking.id)}
              disabled={cancel.isPending}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
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

  if (isLoading) return <p className="text-sm text-gray-500">Loading bookings...</p>;
  if (error) return <p className="text-sm text-red-600">Failed to load bookings</p>;

  if (bookings.length === 0) {
    return (
      <div className="rounded border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-500">No bookings yet. Browse courses to book a session.</p>
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
