import { MyBookings } from '@/features/bookings/components';

export const metadata = { title: 'My Bookings | Student' };

export default function StudentBookingsPage() {
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-[var(--color-accent)] uppercase mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-heading)]">My Bookings</h1>
      </div>
      <MyBookings />
    </div>
  );
}
