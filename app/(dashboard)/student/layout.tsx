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
    <div className="min-h-screen bg-[var(--color-bg)]">
      <nav className="bg-[var(--color-primary)] shadow-[var(--shadow-md)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/student" className="text-xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)]">
                Mihraby
              </Link>
              <div className="ml-8 flex gap-6 text-sm">
                <Link href="/student/courses" className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors">
                  Courses
                </Link>
                <Link href="/student/bookings" className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors">
                  My Bookings
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--color-text-on-primary)]/70">{user?.name ?? ''}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
