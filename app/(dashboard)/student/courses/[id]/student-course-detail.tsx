'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { courseApi } from '@/lib/api';
import { SlotPicker } from '@/features/time-slots';
import { useAvailableSlots } from '@/features/time-slots/api';
import { useInitiateBooking } from '@/features/bookings/api';
import type { ITimeSlot, PaymentMethod } from '@/lib/types';
import { formatPrice } from '@/lib/format';

type StudentCourseDetailProps = {
  courseId: number;
};

type CourseData = {
  id: number;
  title: string;
  description: string | null;
  price: number;
  price_per_slot: number;
  currency: string;
  status: string;
  instructor?: { name: string; email: string };
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'paypal', label: 'PayPal' },
];

export function StudentCourseDetail({ courseId }: StudentCourseDetailProps) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');

  const { data: courseRes, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['student-course', courseId],
    queryFn: async () => {
      const res = await courseApi.getCourseById(courseId);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Course not found');
      return res.data as { course?: CourseData } | CourseData;
    },
    enabled: courseId > 0,
  });

  const course: CourseData | undefined =
    courseRes && typeof courseRes === 'object' && 'course' in courseRes
      ? (courseRes as { course: CourseData }).course
      : (courseRes as CourseData);

  const { data: slots = [], isLoading: slotsLoading } = useAvailableSlots(courseId);
  const initiate = useInitiateBooking();

  const handleBook = () => {
    if (!selectedSlot) return;
    initiate.mutate(
      { slot_id: selectedSlot.id, payment_method: paymentMethod },
      {
        onSuccess: (booking) => {
          // PayPal hosted-checkout is the only launch path. The /pay page
          // initiates the order and redirects to PayPal's approve URL.
          router.push(`/student/bookings/${booking.id}/pay`);
        },
      }
    );
  };

  if (courseLoading) {
    return <p className="text-[var(--color-text-muted)]">Loading course...</p>;
  }
  if (courseError || !course) {
    return (
      <p className="text-[var(--color-error)]">
        Failed to load course. Please try again later.
      </p>
    );
  }

  const price = Number(course.price_per_slot || course.price);

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[var(--color-border)] border-s-4 border-s-[var(--color-accent)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="text-xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)] break-words">{course.title}</h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">{course.description ?? 'No description'}</p>
        <div className="mt-3">
          <span className="text-lg font-semibold text-[var(--color-accent)]">
            {formatPrice(price)} / session
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)]">
        <h3 className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)] mb-3">1. Choose a time</h3>
        {slotsLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading slots...</p>
        ) : (
          <SlotPicker
            courseId={courseId}
            slots={slots}
            onSelect={setSelectedSlot}
            selectedSlotId={selectedSlot?.id ?? null}
          />
        )}
      </div>

      {selectedSlot && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)]">
          <h3 className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)] mb-3">2. Confirm payment</h3>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((pm) => (
              <label key={pm.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value={pm.value}
                  checked={paymentMethod === pm.value}
                  onChange={() => setPaymentMethod(pm.value)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                <span className="text-sm text-[var(--color-text-secondary)]">{pm.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={handleBook}
              disabled={initiate.isPending}
              className="rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] disabled:opacity-50"
            >
              {initiate.isPending ? 'Reserving your slot…' : `Book this session · ${formatPrice(price)}`}
            </button>
            {initiate.isError && (
              <p className="text-sm text-[var(--color-error)]">We couldn’t reserve that time slot. Please try another or try again.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
