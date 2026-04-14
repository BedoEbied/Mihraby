import StudentInstapayPayment from '@/features/bookings/components/student-instapay-payment';

export const metadata = {
  title: 'InstaPay Payment | Student',
};

export default function StudentBookingPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <StudentInstapayPayment params={params} />;
}
