'use client';

import Link from 'next/link';
import { useInstructorCourses } from '@/features/courses/api';
import type { ICourse } from '@/lib/types';

export function InstructorCoursesList() {
  const { data, isLoading, error } = useInstructorCourses();

  const courses: ICourse[] = (data?.data && typeof data.data === 'object' && 'courses' in data.data)
    ? (data.data as { courses: ICourse[] }).courses
    : [];

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
        <p className="text-gray-600">You have no courses yet.</p>
        <Link
          href="/instructor/courses/new"
          className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {course.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
