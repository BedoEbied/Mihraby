'use client';

import { useCourses, useDeleteCourse } from '@/features/courses/api';
import { useAuthorization } from '@/lib/authorization';
import { ErrorBoundary } from '@/lib/components/error-boundary';
import { CourseWithInstructor } from '@/types';
import { formatPrice } from '@/lib/format';

export const CoursesList = () => {
  const { data: courses, isLoading, error } = useCourses();
  const deleteCourse = useDeleteCourse();
  const { checkAccess } = useAuthorization();

  if (isLoading) {
    return <div className="text-center py-8 text-[var(--color-text-muted)]">Loading courses...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[var(--color-error)]">
        Failed to load courses. Please try again later.
      </div>
    );
  }

  const handleDelete = async (courseId: number) => {
    if (confirm('Delete this course? This action cannot be undone.')) {
      await deleteCourse.mutateAsync(courseId);
    }
  };

  if (!courses?.data?.length) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)]">
        No courses found. Check back later or adjust your filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.data.map((course: CourseWithInstructor) => (
        <div key={course.id} className="bg-[var(--color-bg-white)] rounded-xl border border-[var(--color-border)] shadow-sm p-6">
          <h3 className="text-lg font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)] mb-2 truncate">{course.title}</h3>
          <p className="text-[var(--color-text-secondary)] mb-4 line-clamp-2">{course.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-accent)] font-bold">{formatPrice(course.price)}</span>
            <div className="flex gap-2">
              {checkAccess('course:update', course) && (
                <button className="px-4 py-2 border border-[var(--color-accent)] text-[var(--color-accent)] rounded-lg hover:bg-[var(--color-accent)]/10">
                  Edit
                </button>
              )}
              {checkAccess('course:delete', course) && (
                <button
                  onClick={() => handleDelete(course.id)}
                  disabled={deleteCourse.isPending}
                  className="px-4 py-2 text-[var(--color-error)] border border-[var(--color-error)] rounded-lg hover:bg-[var(--color-error)]/10 disabled:opacity-50"
                >
                  {deleteCourse.isPending ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Wrap with ErrorBoundary
export const CoursesListWithBoundary = () => (
  <ErrorBoundary
    fallback={
      <div className="text-center py-8 text-[var(--color-error)]">
        Something went wrong loading courses. Please try again.
      </div>
    }
  >
    <CoursesList />
  </ErrorBoundary>
);
