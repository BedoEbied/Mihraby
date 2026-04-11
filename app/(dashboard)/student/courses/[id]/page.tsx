import type { Metadata } from 'next';
import Link from 'next/link';
import { StudentCourseDetail } from './student-course-detail';

export const metadata: Metadata = {
  title: 'Course | Student',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudentCoursePage({ params }: PageProps) {
  const { id } = await params;
  const courseId = parseInt(id, 10);
  if (Number.isNaN(courseId)) {
    return (
      <div>
        <p className="text-red-600">Invalid course ID</p>
        <Link href="/student/courses" className="text-blue-600 hover:underline">
          Back to courses
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/student/courses"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to courses
        </Link>
      </div>
      <StudentCourseDetail courseId={courseId} />
    </>
  );
}
