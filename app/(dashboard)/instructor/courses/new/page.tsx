import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateCourseForm } from './create-course-form';

export const metadata: Metadata = {
  title: 'Create Course | Instructor',
};

export default function NewCoursePage() {
  return (
    <>
      <div className="mb-4">
        <Link
          href="/instructor/courses"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to courses
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-4">Create course</h2>
      <CreateCourseForm />
    </>
  );
}
