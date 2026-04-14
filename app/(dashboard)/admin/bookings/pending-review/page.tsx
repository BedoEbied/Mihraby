import AdminBookings from '@/features/bookings/components/admin-bookings';
import { requireRole } from '@/lib/auth/session';
import { UserRole } from '@/types';

export const metadata = {
  title: 'Pending Reviews | Admin',
};

export default async function PendingReviewBookingsPage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--color-accent)] mb-1">
          Admin
        </p>
        <h1 className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)]">
          Pending InstaPay Reviews
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Review submitted payment proofs, approve valid transfers, or reject incomplete submissions.
        </p>
      </div>
      <AdminBookings />
    </div>
  );
}
