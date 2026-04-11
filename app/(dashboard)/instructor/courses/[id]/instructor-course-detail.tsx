'use client';

import { useInstructorCourses } from '@/features/courses/api';
import { CourseTimeSlotsManager } from '@/features/time-slots';
import type { ICourse } from '@/lib/types';

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
    return <p className="text-gray-600">Loading course...</p>;
  }
  if (error || !course) {
    return (
      <p className="text-red-600">
        {error instanceof Error ? error.message : 'Course not found'}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
        <p className="mt-2 text-gray-600">{course.description ?? 'No description'}</p>
        <div className="mt-3 flex gap-4 text-sm text-gray-500">
          <span>${Number(course.price)}</span>
          <span className="rounded bg-gray-100 px-2 py-0.5">{course.status}</span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CourseTimeSlotsManager courseId={courseId} />
      </div>
    </div>
  );
}
