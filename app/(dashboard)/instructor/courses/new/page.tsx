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
          className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-light)]"
        >
          ← Back to courses
        </Link>
      </div>
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-[var(--color-accent)] uppercase mb-1">New</p>
        <h2 className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)]">Create course</h2>
      </div>
      <CreateCourseForm />
    </>
  );
}
