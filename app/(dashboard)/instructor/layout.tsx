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
    <div className="min-h-screen bg-[var(--color-bg)]">
      <nav className="bg-[var(--color-primary)] border-b-2 border-[var(--color-accent)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/instructor" className="text-2xl font-bold text-[var(--color-text-on-primary)] font-[family-name:var(--font-heading)]">
                Mihraby
              </Link>
              <div className="ms-4 sm:ms-10 flex gap-3 sm:gap-8 text-sm font-medium">
                <Link href="/instructor/courses" className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors py-2 whitespace-nowrap">
                  My Courses
                </Link>
                <Link href="/instructor/bookings" className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors py-2 whitespace-nowrap">
                  My Sessions
                </Link>
                <Link href="/instructor/courses/new" className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors py-2">
                  Create
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-accent)] text-xs font-bold text-[var(--color-text-on-primary)]">{(user?.name ?? '?')[0].toUpperCase()}</span>
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
