'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { courseApi } from '@/lib/api';
import { SlotPicker } from '@/features/time-slots';
import { useAvailableSlots } from '@/features/time-slots/api';
import { useInitiateBooking, useCreateCheckoutSession } from '@/features/bookings/api';
import type { ITimeSlot, PaymentMethod } from '@/lib/types';

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
  { value: 'paymob_card', label: 'Credit / Debit Card' },
  { value: 'paymob_wallet', label: 'Vodafone Cash' },
  { value: 'paymob_fawry', label: 'Fawry' },
  { value: 'instapay', label: 'InstaPay (manual transfer)' },
];

export function StudentCourseDetail({ courseId }: StudentCourseDetailProps) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paymob_card');

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
  const checkout = useCreateCheckoutSession();

  const handleBook = () => {
    if (!selectedSlot) return;
    initiate.mutate(
      { slot_id: selectedSlot.id, payment_method: paymentMethod },
      {
        onSuccess: (booking) => {
          if (paymentMethod.startsWith('paymob_')) {
            checkout.mutate(
              { bookingId: booking.id, paymentMethod },
              {
                onSuccess: ({ redirectUrl }) => {
                  window.location.href = redirectUrl;
                },
              }
            );
          } else {
            // InstaPay — go to bookings page (pending_review)
            router.push('/student/bookings');
          }
        },
      }
    );
  };

  if (courseLoading || courseError || !course) {
    return (
      <p className="text-red-600">
        {courseError instanceof Error ? courseError.message : 'Loading...'}
      </p>
    );
  }

  const price = Number(course.price_per_slot || course.price);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
        <p className="mt-2 text-gray-600">{course.description ?? 'No description'}</p>
        <div className="mt-3">
          <span className="text-lg font-semibold text-blue-600">
            {price} EGP / session
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Pick a time</h3>
        {slotsLoading ? (
          <p className="text-sm text-gray-500">Loading slots...</p>
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
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Payment method</h3>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((pm) => (
              <label key={pm.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value={pm.value}
                  checked={paymentMethod === pm.value}
                  onChange={() => setPaymentMethod(pm.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">{pm.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={handleBook}
              disabled={initiate.isPending || checkout.isPending}
              className="rounded bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {initiate.isPending || checkout.isPending ? 'Processing...' : `Book for ${price} EGP`}
            </button>
            {initiate.isError && (
              <p className="text-sm text-red-600">{initiate.error.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
