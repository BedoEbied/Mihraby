import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';
import { UserRole } from '@/types';
import { LogoutButton } from '@/lib/components/logout-button';

export const metadata = {
  title: 'Student Dashboard | Mihraby',
  description: 'Browse and manage your courses.',
};

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireRole([UserRole.STUDENT]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Mihraby Student</h1>
              <div className="ml-6 flex gap-4 text-sm text-gray-600">
                <Link href="/student/courses" className="hover:text-gray-900">
                  Courses
                </Link>
                <Link href="/student/my-courses" className="hover:text-gray-900">
                  My Courses
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
