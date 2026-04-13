import type { Metadata } from 'next';
import Link from 'next/link';
import { InstructorCoursesList } from './instructor-courses-list';

export const metadata: Metadata = {
  title: 'My Courses | Instructor',
};

export default function InstructorCoursesPage() {
  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-[var(--color-accent)] uppercase mb-1">Manage</p>
        <h2 className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)]">My Courses</h2>
      </div>
      <InstructorCoursesList />
    </>
  );
}
