'use client';

import Link from 'next/link';
import { useCourses } from '@/features/courses/api';
import type { CourseWithInstructor } from '@/lib/types';
import { formatPrice } from '@/lib/format';

export function StudentCoursesList() {
  const { data, isLoading, error } = useCourses();

  const response = data as
    | { success: boolean; data?: { courses?: CourseWithInstructor[] } }
    | undefined;
  const courses: CourseWithInstructor[] = response?.data?.courses ?? [];

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
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-sm)]">
        <p className="text-[var(--color-text-secondary)]">No courses available right now. Check back soon for new offerings.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Link
          key={course.id}
          href={`/student/courses/${course.id}`}
          className="block rounded-xl border border-[var(--color-border)] border-s-4 border-s-[var(--color-accent)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)] hover:border-[var(--color-accent)]/50 hover:shadow-[var(--shadow-md)] transition-[border-color,box-shadow] duration-200"
        >
          <h3 className="font-semibold text-[var(--color-text)] font-[family-name:var(--font-heading)] truncate">{course.title}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">
            {course.description ?? 'No description'}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-accent)]">
              {formatPrice(course.price)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
