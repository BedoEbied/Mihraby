'use client';

import { useInstructorCourses } from '@/features/courses/api';
import { CourseTimeSlotsManager } from '@/features/time-slots';
import type { ICourse } from '@/lib/types';
import { formatPrice } from '@/lib/format';

type InstructorCourseDetailProps = {
  courseId: number;
};

export function InstructorCourseDetail({ courseId }: InstructorCourseDetailProps) {
  const { data, isLoading, error } = useInstructorCourses();

  const courses: ICourse[] =
    data?.data && typeof data.data === 'object' && 'courses' in data.data
      ? (data.data as { courses: ICourse[] }).courses
      : [];
  const course = courses.find((c) => c.id === courseId);

  if (isLoading) {
    return <p className="text-[var(--color-text-secondary)]">Loading course...</p>;
  }
  if (error || !course) {
    return (
      <p className="text-[var(--color-error)]">
        Course not found or failed to load. Please try again later.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border-s-4 border-s-[var(--color-accent)] border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)]">
        <h2 className="text-xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)] break-words">{course.title}</h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">{course.description ?? 'No description'}</p>
        <div className="mt-3 flex gap-4 text-sm text-[var(--color-text-secondary)]">
          <span className="font-medium text-[var(--color-accent)]">{formatPrice(course.price)}</span>
          <span className="whitespace-nowrap rounded bg-[var(--color-surface)] px-2 py-0.5 text-[var(--color-text-secondary)]">{course.status}</span>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)]">
        <CourseTimeSlotsManager courseId={courseId} />
      </div>
    </div>
  );
}
