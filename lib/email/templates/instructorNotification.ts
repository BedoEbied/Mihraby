import type { IBooking, ICourse, UserWithoutPassword } from '@/lib/types';

export function instructorNotificationTemplate(params: {
  booking: IBooking;
  course: ICourse;
  student: UserWithoutPassword;
  instructor: UserWithoutPassword;
}) {
  const { booking, course, student, instructor } = params;
  return {
    subject: `New booking: ${course.title}`,
    html: `
      <h2>New booking</h2>
      <p>Hi ${instructor.name},</p>
      <p><strong>${student.name}</strong> booked <strong>${course.title}</strong>.</p>
      <ul>
        <li>Booking ID: ${booking.id}</li>
        <li>Status: ${booking.status}</li>
        <li>Payment: ${booking.payment_status}</li>
      </ul>
    `,
  };
}

