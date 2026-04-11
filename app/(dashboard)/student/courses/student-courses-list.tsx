'use client';

import Link from 'next/link';
import { useCourses } from '@/features/courses/api';
import type { CourseWithInstructor } from '@/lib/types';

export function StudentCoursesList() {
  const { data, isLoading, error } = useCourses();

  const response = data as
    | { success: boolean; data?: { courses?: CourseWithInstructor[] } }
    | undefined;
  const courses: CourseWithInstructor[] = response?.data?.courses ?? [];

  if (isLoading) {
    return <p className="text-gray-600">Loading courses...</p>;
  }
  if (error) {
    return (
      <p className="text-red-600">Failed to load courses: {error.message}</p>
    );
  }
  if (courses.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">No published courses yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Link
          key={course.id}
          href={`/student/courses/${course.id}`}
          className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow"
        >
          <h3 className="font-semibold text-gray-900">{course.title}</h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {course.description ?? 'No description'}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600">
              ${Number(course.price)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
