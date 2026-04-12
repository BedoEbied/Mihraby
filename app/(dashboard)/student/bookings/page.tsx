import { MyBookings } from '@/features/bookings/components';

export const metadata = { title: 'My Bookings | Student' };

export default function StudentBookingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>
      <MyBookings />
    </div>
  );
}
