'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { courseApi } from '@/lib/api';
import { useEnrollInCourse } from '@/features/courses/api';
import { SlotPicker } from '@/features/time-slots';
import { useAvailableSlots } from '@/features/time-slots/api';
import type { ITimeSlot } from '@/lib/types';

type StudentCourseDetailProps = {
  courseId: number;
};

type CourseData = {
  id: number;
  title: string;
  description: string | null;
  price: number;
  status: string;
  instructor?: { name: string; email: string };
};

export function StudentCourseDetail({ courseId }: StudentCourseDetailProps) {
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);

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
  const enroll = useEnrollInCourse();

  if (courseLoading || courseError || !course) {
    return (
      <p className="text-red-600">
        {courseError instanceof Error ? courseError.message : 'Loading...'}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
        <p className="mt-2 text-gray-600">{course.description ?? 'No description'}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-semibold text-blue-600">
            ${Number(course.price)}
          </span>
          {course.status !== 'published' && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {course.status}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Available times</h3>
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

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Enroll</h3>
        <p className="text-sm text-gray-600 mb-3">
          Enroll in this course to get access. Booking a specific time slot will be available after enrollment (coming soon).
        </p>
        <button
          type="button"
          onClick={() => enroll.mutate(courseId)}
          disabled={enroll.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {enroll.isPending ? 'Enrolling...' : 'Enroll in course'}
        </button>
      </div>
    </div>
  );
}
