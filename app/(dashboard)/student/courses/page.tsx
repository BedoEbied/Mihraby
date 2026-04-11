import type { Metadata } from 'next';
import { StudentCoursesList } from './student-courses-list';

export const metadata: Metadata = {
  title: 'Browse Courses | Student',
};

export default function StudentCoursesPage() {
  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Browse courses</h2>
      <StudentCoursesList />
    </>
  );
}
