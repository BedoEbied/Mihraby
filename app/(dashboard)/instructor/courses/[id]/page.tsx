import type { Metadata } from 'next';
import Link from 'next/link';
import { InstructorCourseDetail } from './instructor-course-detail';

export const metadata: Metadata = {
  title: 'Course | Instructor',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InstructorCoursePage({ params }: PageProps) {
  const { id } = await params;
  const courseId = parseInt(id, 10);
  if (Number.isNaN(courseId)) {
    return (
      <div>
        <p className="text-[var(--color-error)]">Invalid course ID</p>
        <Link href="/instructor/courses" className="text-[var(--color-accent)] hover:text-[var(--color-accent-light)]">
          Back to courses
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/instructor/courses"
          className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-light)]"
        >
          ← Back to courses
        </Link>
      </div>
      <InstructorCourseDetail courseId={courseId} />
    </>
  );
}
