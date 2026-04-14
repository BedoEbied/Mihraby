'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useBookingDetail, useUploadPaymentProof } from '@/features/bookings/api';
import { formatPrice } from '@/lib/format';

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-primary)]',
  confirmed: 'border-[var(--color-success)]/30 bg-[var(--color-success-light)] text-[var(--color-success)]',
  cancelled: 'border-[var(--color-error)]/30 bg-[var(--color-error-light)] text-[var(--color-error)]',
};

type StudentInstapayPaymentProps = {
  params: Promise<{ id: string }>;
};

export default function StudentInstapayPayment({ params }: StudentInstapayPaymentProps) {
  const { id } = use(params);
  const bookingId = Number(id);
  const { data: booking, isLoading, error, refetch } = useBookingDetail(bookingId);
  const uploadProof = useUploadPaymentProof(bookingId);

  const [transactionReference, setTransactionReference] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!booking || booking.status !== 'pending_review') return;
    const timer = window.setInterval(() => {
      refetch();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [booking, refetch]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    await uploadProof.mutateAsync({
      transaction_reference: transactionReference,
      file,
    });
    setFile(null);
    refetch();
  };

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading booking...</p>;
  }

  if (error || !booking) {
    return <p className="text-sm text-[var(--color-error)]">Failed to load booking details.</p>;
  }

  const canUpload = booking.status === 'pending_review';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-accent)] mb-1">
            Payment
          </p>
          <h1 className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)]">
            InstaPay Proof Submission
          </h1>
        </div>
        <Link
          href="/student/bookings"
          className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-light)]"
        >
          Back to My Bookings
        </Link>
      </div>

      <div className={`rounded-xl border p-4 shadow-[var(--shadow-sm)] ${STATUS_STYLES[booking.status] ?? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em]">Current status</p>
        <p className="mt-1 text-lg font-semibold capitalize">{booking.status.replace('_', ' ')}</p>
        <p className="mt-2 text-sm">
          {booking.status === 'pending_review' && 'Upload your transfer screenshot and reference number. An admin will review it shortly.'}
          {booking.status === 'confirmed' && 'Your payment has been approved. Your booking is confirmed.'}
          {booking.status === 'cancelled' && 'This booking was cancelled. Create a new booking if you still want this session.'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)]">
            Booking summary
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--color-text-muted)]">Booking ID</dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">#{booking.id}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Amount</dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">{formatPrice(booking.amount)}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Payment method</dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">{booking.payment_method ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Payment status</dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">{booking.payment_status}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Transfer reference</dt>
              <dd className="mt-1 font-medium text-[var(--color-text)]">{booking.instapay_reference ?? 'Not submitted yet'}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)]">
            InstaPay instructions
          </h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
            <p>1. Transfer the session amount using InstaPay to the admin wallet below.</p>
            <p>2. Capture a clear screenshot showing the transfer result and reference number.</p>
            <p>3. Upload the screenshot and paste the transfer reference.</p>
          </div>
          <div className="mt-4 rounded-lg bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text)]">
            <p className="font-medium">Recipient: Mihraby Finance</p>
            <p className="mt-1">InstaPay handle: `mihraby@bank`</p>
            <p className="mt-1">Reference note: include your booking ID `#{booking.id}`</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)]"
      >
        <h2 className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)]">
          Upload payment proof
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Transaction reference
            </span>
            <input
              type="text"
              value={transactionReference}
              onChange={(event) => setTransactionReference(event.target.value)}
              disabled={!canUpload || uploadProof.isPending}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30 disabled:bg-[var(--color-surface)]"
              placeholder="e.g. INSTA-123456"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Screenshot
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={!canUpload || uploadProof.isPending}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm file:me-3 file:rounded-md file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1.5 file:text-[var(--color-text-on-accent)] disabled:bg-[var(--color-surface)]"
              required
            />
          </label>
        </div>

        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Accepted formats: PNG, JPEG, WEBP. Maximum size: 5 MB.
        </p>

        {uploadProof.isError && (
          <p className="mt-3 text-sm text-[var(--color-error)]">
            {uploadProof.error.message}
          </p>
        )}

        {booking.payment_proof_path && (
          <p className="mt-3 text-sm text-[var(--color-success)]">
            Proof uploaded successfully. Waiting for admin review.
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={!canUpload || uploadProof.isPending || !file}
            className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] disabled:opacity-50"
          >
            {uploadProof.isPending ? 'Uploading...' : 'Submit proof'}
          </button>
          {!canUpload && (
            <span className="text-sm text-[var(--color-text-muted)]">
              Uploads are disabled after review is completed.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
