import type { IBooking, ICourse, UserWithoutPassword } from '@/lib/types';

export function bookingConfirmationTemplate(params: {
  booking: IBooking;
  course: ICourse;
  student: UserWithoutPassword;
  meetingLink: string | null;
}) {
  const { booking, course, student, meetingLink } = params;
  return {
    subject: `Booking confirmed: ${course.title}`,
    html: `
      <h2>Booking confirmed</h2>
      <p>Hi ${student.name},</p>
      <p>Your booking for <strong>${course.title}</strong> is confirmed.</p>
      <ul>
        <li>Booking ID: ${booking.id}</li>
        <li>Status: ${booking.status}</li>
        <li>Payment: ${booking.payment_status}</li>
        ${meetingLink ? `<li>Meeting link: <a href="${meetingLink}">${meetingLink}</a></li>` : ''}
      </ul>
    `,
  };
}

