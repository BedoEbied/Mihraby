import type { Metadata } from 'next';
import { StudentCoursesList } from './student-courses-list';

export const metadata: Metadata = {
  title: 'Browse Courses | Student',
};

export default function StudentCoursesPage() {
  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-[var(--color-accent)] uppercase mb-1">Explore</p>
        <h2 className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)]">Browse Courses</h2>
      </div>
      <StudentCoursesList />
    </>
  );
}
