import type { Metadata } from 'next';
import Link from 'next/link';
import { InstructorCoursesList } from './instructor-courses-list';

export const metadata: Metadata = {
  title: 'My Courses | Instructor',
};

export default function InstructorCoursesPage() {
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">My Courses</h2>
      <InstructorCoursesList />
    </>
  );
}
