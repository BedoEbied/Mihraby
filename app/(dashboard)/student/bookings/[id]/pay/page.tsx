'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBookingDetail, useInitiatePaypalCheckout } from '@/features/bookings/api';

export const dynamic = 'force-dynamic';

export default function StudentPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookingId = Number(id);
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled') === '1';

  const { data: booking, isLoading: bookingLoading } = useBookingDetail(bookingId);
  const initiate = useInitiatePaypalCheckout();
  const [error, setError] = useState<string | null>(null);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(bookingId) || bookingId <= 0) return;
    if (cancelled) return;
    if (initiate.isPending || initiate.isSuccess || redirected) return;
    if (!booking) return;
    if (booking.status !== 'pending_payment') return;

    initiate.mutate(bookingId, {
      onSuccess: ({ redirectUrl }) => {
        setRedirected(true);
        window.location.assign(redirectUrl);
      },
      onError: (e) => {
        setError(e.message || 'Could not start PayPal checkout');
      },
    });
  }, [bookingId, booking, cancelled, initiate, redirected]);

  if (bookingLoading) {
    return <Spinner label="Loading booking..." />;
  }

  if (!booking) {
    return (
      <Card tone="error" title="Booking not found">
        <p className="text-[var(--color-text-secondary)]">
          We couldn&apos;t find a booking with that id.
        </p>
        <CtaLink href="/student/bookings">Go to my bookings</CtaLink>
      </Card>
    );
  }

  if (booking.status === 'confirmed') {
    return (
      <Card tone="success" title="Already paid">
        <p className="text-[var(--color-text-secondary)]">
          This booking is already confirmed.
        </p>
        <CtaLink href="/student/bookings">View my bookings</CtaLink>
      </Card>
    );
  }

  if (booking.status !== 'pending_payment') {
    return (
      <Card tone="error" title="Cannot pay for this booking">
        <p className="text-[var(--color-text-secondary)]">
          This booking is in status &quot;{booking.status}&quot; and can no longer be paid.
        </p>
        <CtaLink href="/student/bookings">Go to my bookings</CtaLink>
      </Card>
    );
  }

  if (cancelled) {
    return (
      <Card tone="error" title="Payment cancelled">
        <p className="text-[var(--color-text-secondary)]">
          You cancelled the PayPal checkout. You can retry below.
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setRedirected(false);
            initiate.mutate(bookingId, {
              onSuccess: ({ redirectUrl }) => {
                setRedirected(true);
                window.location.assign(redirectUrl);
              },
              onError: (e) => setError(e.message || 'Could not start PayPal checkout'),
            });
          }}
          className="mt-4 inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)]"
        >
          Retry PayPal
        </button>
      </Card>
    );
  }

  if (error) {
    return (
      <Card tone="error" title="Couldn't start PayPal checkout">
        <p className="text-[var(--color-text-secondary)]">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setRedirected(false);
            initiate.mutate(bookingId, {
              onSuccess: ({ redirectUrl }) => {
                setRedirected(true);
                window.location.assign(redirectUrl);
              },
              onError: (e) => setError(e.message || 'Could not start PayPal checkout'),
            });
          }}
          className="mt-4 inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)]"
        >
          Try again
        </button>
      </Card>
    );
  }

  return <Spinner label="Redirecting to PayPal..." />;
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      <p className="mt-4 text-[var(--color-text-secondary)]">{label}</p>
    </div>
  );
}

function Card({
  tone,
  title,
  children,
}: {
  tone: 'success' | 'error';
  title: string;
  children: React.ReactNode;
}) {
  const toneCls =
    tone === 'success'
      ? 'border-[var(--color-success)]/20 bg-[var(--color-success-light)]'
      : 'border-[var(--color-error)]/20 bg-[var(--color-error-light)]';
  const titleCls = tone === 'success' ? 'text-[var(--color-text)]' : 'text-[var(--color-error)]';
  return (
    <div className={`mx-auto max-w-lg rounded-xl border p-6 text-center shadow-[var(--shadow-sm)] ${toneCls}`}>
      <h2 className={`text-xl font-bold font-[family-name:var(--font-heading)] ${titleCls}`}>{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function CtaLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)]"
    >
      {children}
    </Link>
  );
}
