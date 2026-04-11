import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';
import { UserRole } from '@/types';
import { LogoutButton } from '@/lib/components/logout-button';

export const metadata = {
  title: 'Instructor Dashboard | Mihraby',
  description: 'Manage your courses and enrollments.',
};

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const user = await requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Mihraby Instructor</h1>
              <div className="ml-6 flex gap-4 text-sm text-gray-600">
                <Link href="/instructor/courses" className="hover:text-gray-900">
                  My Courses
                </Link>
                <Link href="/instructor/courses/new" className="hover:text-gray-900">
                  Create
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{user?.name ?? ''}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">{children}</div>
      </main>
    </div>
  );
}
