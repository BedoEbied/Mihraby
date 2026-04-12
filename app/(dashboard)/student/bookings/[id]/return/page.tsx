'use client';

import { use } from 'react';
import Link from 'next/link';
import { useBookingPayStatus } from '@/features/bookings/api';

export default function BookingReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const bookingId = Number(id);
  const { data, isLoading, error } = useBookingPayStatus(bookingId);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-gray-600">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">Something went wrong verifying your payment.</p>
        <Link href="/student/bookings" className="mt-4 inline-block text-blue-600 hover:underline">
          Go to My Bookings
        </Link>
      </div>
    );
  }

  if (data.status === 'confirmed') {
    return (
      <div className="rounded border border-green-200 bg-green-50 p-6 text-center">
        <h2 className="text-xl font-bold text-green-800">Payment Successful!</h2>
        <p className="mt-2 text-green-700">Your booking has been confirmed.</p>
        <Link
          href="/student/bookings"
          className="mt-4 inline-block rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  if (data.status === 'cancelled') {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-xl font-bold text-red-800">Payment Not Completed</h2>
        <p className="mt-2 text-red-700">Your booking was cancelled or the payment failed.</p>
        <Link
          href="/student/courses"
          className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Browse Courses
        </Link>
      </div>
    );
  }

  // Still pending — spinner continues via refetchInterval
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      <p className="mt-4 text-gray-600">Verifying your payment...</p>
    </div>
  );
}
