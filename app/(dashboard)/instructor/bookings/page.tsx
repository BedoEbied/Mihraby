import { InstructorBookings } from '@/features/bookings/components';
import { requireRole } from '@/lib/auth/session';
import { UserRole } from '@/types';

export const metadata = { title: 'My Sessions | Instructor' };

export default async function InstructorBookingsPage() {
  await requireRole([UserRole.INSTRUCTOR]);
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-[var(--color-accent)] uppercase mb-1">
          Dashboard
        </p>
        <h1 className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)]">
          My Sessions
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Upcoming and past student bookings across all your courses.
        </p>
      </div>
      <InstructorBookings />
    </div>
  );
}
