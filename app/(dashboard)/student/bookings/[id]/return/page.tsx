'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBookingPayStatus, useCapturePaypalOrder } from '@/features/bookings/api';

export const dynamic = 'force-dynamic';

type CaptureState = 'idle' | 'capturing' | 'confirmed' | 'failed';

export default function BookingReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookingId = Number(id);
  const searchParams = useSearchParams();
  const orderId = searchParams.get('token');

  const capture = useCapturePaypalOrder(bookingId);
  const [state, setState] = useState<CaptureState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const ranRef = useRef(false);

  // Fallback polling for any return that arrives without a PayPal token
  // (e.g. legacy InstaPay path). When token IS present we drive the state
  // ourselves via the capture mutation.
  const polling = useBookingPayStatus(bookingId);

  useEffect(() => {
    if (!orderId) return;
    if (ranRef.current) return;
    ranRef.current = true;
    setState('capturing');
    capture.mutate(orderId, {
      onSuccess: () => setState('confirmed'),
      onError: (e) => {
        setErrorMsg(e.message || 'Capture failed');
        setState('failed');
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // PayPal capture flow ----------------------------------------------------
  if (orderId) {
    if (state === 'capturing' || state === 'idle') {
      return (
        <Spinner label="Confirming your payment with PayPal…" />
      );
    }

    if (state === 'confirmed') {
      return (
        <Card tone="success" title="Session confirmed — barakAllāhu fīk">
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Your booking is confirmed. Your teacher will contact you by email with
            the meeting link and any preparation materials before the session starts.
            You can also track this session in your bookings list.
          </p>
          <CtaLink href="/student/bookings">View my bookings</CtaLink>
        </Card>
      );
    }

    return (
      <Card tone="error" title="We couldn’t confirm your payment">
        <p className="mt-2 text-[var(--color-text-secondary)]">
          {errorMsg ?? "We couldn't capture your PayPal payment. You can retry from the booking page."}
        </p>
        <CtaLink href={`/student/bookings/${bookingId}/pay`}>Try again</CtaLink>
      </Card>
    );
  }

  // Polling fallback (no token) --------------------------------------------
  const data = polling.data;

  if (polling.isLoading || !data) {
    return <Spinner label="Verifying your payment…" />;
  }

  if (polling.error) {
    return (
      <Card tone="error" title="We couldn’t verify your payment">
        <p className="text-[var(--color-text-secondary)]">
          Your booking may still be processing. You can check its status from your bookings list.
        </p>
        <CtaLink href="/student/bookings">View my bookings</CtaLink>
      </Card>
    );
  }

  if (data.status === 'confirmed') {
    return (
      <Card tone="success" title="Session confirmed — barakAllāhu fīk">
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Your booking is confirmed. Your teacher will share the meeting details
          before the session begins. You can check your bookings at any time.
        </p>
        <CtaLink href="/student/bookings">View my bookings</CtaLink>
      </Card>
    );
  }

  if (data.status === 'cancelled') {
    return (
      <Card tone="error" title="Payment not completed">
        <p className="mt-2 text-[var(--color-text-secondary)]">
          The payment wasn’t completed, so your session was not booked. You can try again whenever you’re ready.
        </p>
        <CtaLink href="/student/courses">Find a Teacher</CtaLink>
      </Card>
    );
  }

  return <Spinner label="Verifying your payment…" />;
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
    <div
      className={`mx-auto max-w-lg rounded-xl border p-6 text-center shadow-[var(--shadow-sm)] ${toneCls}`}
    >
      <h2 className={`text-xl font-bold font-[family-name:var(--font-heading)] ${titleCls}`}>{title}</h2>
      {children}
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
