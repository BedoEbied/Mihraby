'use client';

import Link from 'next/link';
import { useInstructorCourses } from '@/features/courses/api';
import type { ICourse } from '@/lib/types';
import { formatPrice } from '@/lib/format';

export function InstructorCoursesList() {
  const { data, isLoading, error } = useInstructorCourses();

  const courses: ICourse[] = (data?.data && typeof data.data === 'object' && 'courses' in data.data)
    ? (data.data as { courses: ICourse[] }).courses
    : [];

  if (isLoading) {
    return <p className="text-[var(--color-text-secondary)]">Loading courses...</p>;
  }
  if (error) {
    return (
      <p className="text-[var(--color-error)]">Failed to load courses. Please try again later.</p>
    );
  }
  if (courses.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-8 text-center shadow-[var(--shadow-sm)]">
        <p className="text-[var(--color-text-secondary)]">You have no courses yet.</p>
        <Link
          href="/instructor/courses/new"
          className="mt-4 inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)]"
        >
          Create your first course
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Link
          key={course.id}
          href={`/instructor/courses/${course.id}`}
          className="block rounded-xl border-s-4 border-s-[var(--color-accent)] border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)] hover:border-[var(--color-accent)]/50 hover:shadow-[var(--shadow-md)] transition-[border-color,box-shadow] duration-200"
        >
          <h3 className="font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)] truncate">{course.title}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">
            {course.description ?? 'No description'}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-accent)]">
              {formatPrice(course.price)}
            </span>
            <span className="whitespace-nowrap rounded bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
              {course.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
