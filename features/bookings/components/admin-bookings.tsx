'use client';

import { useMemo, useState } from 'react';
import { useAdminApproveBooking, useAdminBookings, useAdminRejectBooking } from '@/features/bookings/api';
import { formatPrice } from '@/lib/format';
import { formatInCairo } from '@/lib/time';

function formatDate(value: Date | string): string {
  return formatInCairo(new Date(value));
}

export default function AdminBookings() {
  const { data: bookings = [], isLoading, error } = useAdminBookings({
    status: 'pending_review',
    limit: 50,
  });
  const approveBooking = useAdminApproveBooking();
  const rejectBooking = useAdminRejectBooking();

  const [previewBookingId, setPreviewBookingId] = useState<number | null>(null);
  const [rejectBookingId, setRejectBookingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const previewBooking = useMemo(
    () => bookings.find((booking) => booking.id === previewBookingId) ?? null,
    [bookings, previewBookingId]
  );

  const handleReject = async () => {
    if (!rejectBookingId) return;
    await rejectBooking.mutateAsync({ bookingId: rejectBookingId, reason: rejectReason });
    setRejectBookingId(null);
    setRejectReason('');
  };

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading pending reviews...</p>;
  }

  if (error) {
    return <p className="text-sm text-[var(--color-error)]">Failed to load pending-review bookings.</p>;
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 text-center shadow-[var(--shadow-sm)]">
        <p className="text-[var(--color-text-muted)]">No pending InstaPay reviews right now.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-[var(--color-surface)]">
              <tr className="text-left text-[var(--color-text-secondary)]">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Slot</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-text)]">{booking.student_name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{booking.student_email}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">{booking.course_title}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {formatDate(booking.slot_start_time)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">{formatPrice(booking.amount)}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{booking.instapay_reference ?? 'Missing'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewBookingId(booking.id)}
                        className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                      >
                        View proof
                      </button>
                      <button
                        type="button"
                        onClick={() => approveBooking.mutate(booking.id)}
                        disabled={approveBooking.isPending}
                        className="rounded-md bg-[var(--color-success)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectBookingId(booking.id);
                          setRejectReason('');
                        }}
                        disabled={rejectBooking.isPending}
                        className="rounded-md bg-[var(--color-error)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.55)] p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-[var(--color-bg-white)] p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)]">
                  Proof for booking #{previewBooking.id}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {previewBooking.student_name} • {previewBooking.course_title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewBookingId(null)}
                className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              >
                Close
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              {/* Protected proof images must load with browser cookies; do not route through next/image optimization. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/admin/payment-proofs/${previewBooking.id}`}
                alt={`Payment proof for booking ${previewBooking.id}`}
                className="h-auto max-h-[70vh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {rejectBookingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.55)] p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--color-bg-white)] p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)]">
            <h2 className="text-xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)]">
              Reject booking #{rejectBookingId}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Provide a short reason that will be stored on the booking for audit history.
            </p>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={4}
              className="mt-4 w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30"
              placeholder="Explain why the proof was rejected"
            />
            {rejectBooking.isError && (
              <p className="mt-3 text-sm text-[var(--color-error)]">{rejectBooking.error.message}</p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectBookingId(null);
                  setRejectReason('');
                }}
                className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={rejectBooking.isPending || rejectReason.trim().length < 3}
                className="rounded-md bg-[var(--color-error)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {rejectBooking.isPending ? 'Rejecting...' : 'Reject booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
