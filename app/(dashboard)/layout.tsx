import type { ReactNode } from 'react';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard | Mihraby',
  description: 'Manage courses, bookings, and time slots on Mihraby.',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
        {children}
      </Suspense>
    </div>
  );
}
