// ============================================================================
// Canonical Mihraby types.
// Backend (services, models, routes) imports from '@/types'.
// Frontend imports from '@/lib/types' which re-exports this module.
// Keep this file in sync with the database migrations in /migrations.
// ============================================================================

// ----- User / Role -----
export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
  INSTRUCTOR = 'instructor'
}

export interface IUser {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  created_at: Date;
}

// ----- Course -----
export type CourseStatus = 'draft' | 'published' | 'archived';
export type MeetingPlatform = 'zoom' | 'google_meet' | 'manual';

export interface ICourse {
  id: number;
  title: string;
  description: string | null;
  instructor_id: number;
  price: number;
  image_url: string | null;
  status: CourseStatus;
  slot_duration: number;
  price_per_slot: number;
  meeting_platform: MeetingPlatform;
  meeting_link: string | null;
  currency: string;
  created_at: Date;
}

// ----- Enrollment -----
export interface IEnrollment {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: Date;
}

// ----- Time slot -----
export interface ITimeSlot {
  id: number;
  course_id: number;
  start_time: Date;
  end_time: Date;
  is_available: boolean;
  booked_by: number | null;
  created_at: Date;
}

// ----- Booking -----
/**
 * Full booking state machine.
 *   pending_payment: student chose a gateway (Paymob) but has not completed checkout yet
 *   pending_review:  student uploaded an InstaPay proof; awaiting admin review
 *   confirmed:       payment verified; slot locked; Zoom meeting created (or pending)
 *   cancelled:       expired hold, student cancellation, or admin rejection
 *   completed:       session has taken place
 *   no_show:         instructor marked student as no-show after session time passed
 */
export type BookingStatus =
  | 'pending_payment'
  | 'pending_review'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type PaymentMethod = 'paymob_card' | 'paymob_wallet' | 'paymob_fawry' | 'instapay';

/**
 * Meeting state for a booking.
 *   pending_meeting: booking is confirmed but Zoom API call failed — retry in progress
 */
export type BookingMeetingPlatform = MeetingPlatform | 'pending_meeting';

export interface IBooking {
  id: number;
  user_id: number;
  course_id: number;
  slot_id: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_id: string | null;
  transaction_id: string | null;
  amount: number;
  meeting_link: string | null;
  meeting_id: string | null;
  meeting_platform: BookingMeetingPlatform;
  status: BookingStatus;
  booked_at: Date;
  cancelled_at: Date | null;

  // InstaPay manual review fields
  instapay_reference: string | null;
  payment_proof_path: string | null;
  payment_proof_uploaded_at: Date | null;
  admin_notes: string | null;
}

// ----- Instructor integration (Zoom, etc.) -----
export type IntegrationProvider = 'zoom';

export interface IInstructorIntegration {
  id: number;
  instructor_id: number;
  provider: IntegrationProvider;
  /** Encrypted. Decrypt via InstructorIntegration model helper. */
  access_token: string;
  /** Encrypted. Decrypt via InstructorIntegration model helper. */
  refresh_token: string;
  expires_at: Date;
  provider_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface IBookingMeetingRetry {
  id: number;
  booking_id: number;
  attempts: number;
  last_error: string | null;
  next_retry_at: Date;
  created_at: Date;
  updated_at: Date;
}

// ----- JWT -----
export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ----- API responses -----
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
}

// ----- Auth DTOs -----
export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<IUser, 'password'>;
}

// ----- Course DTOs -----
/**
 * Note: slot_duration and price_per_slot have defaults at the DB level (60 minutes
 * and 0 EGP respectively). They are optional in the DTO to preserve compatibility
 * with legacy course-creation callers; Phase 1 validators enforce presence in the
 * instructor course-creation flow where they must be set before any slot can be booked.
 */
export interface CreateCourseDTO {
  title: string;
  description?: string;
  price: number;
  image_url?: string;
  status?: 'draft' | 'published';
  slot_duration?: number;
  price_per_slot?: number;
  meeting_platform?: MeetingPlatform;
  meeting_link?: string;
  currency?: string;
}

export interface UpdateCourseDTO {
  title?: string;
  description?: string;
  price?: number;
  image_url?: string;
  status?: CourseStatus;
  slot_duration?: number;
  price_per_slot?: number;
  meeting_platform?: MeetingPlatform;
  meeting_link?: string;
  currency?: string;
}

// ----- Time slot DTOs -----
export interface CreateTimeSlotDTO {
  course_id: number;
  start_time: string; // ISO datetime
  end_time: string;   // ISO datetime
}

export interface CreateTimeSlotsBulkDTO {
  course_id: number;
  slots: Array<{ start_time: string; end_time: string }>;
}

export interface UpdateTimeSlotDTO {
  start_time?: string;
  end_time?: string;
}

// ----- Booking DTOs -----
export interface InitiateBookingDTO {
  slot_id: number;
  payment_method: PaymentMethod;
}

export interface CreatePaymentDTO {
  booking_id: number;
}

export interface UpdateBookingStatusDTO {
  status: BookingStatus;
}

export interface SubmitInstapayProofDTO {
  transaction_reference: string;
  // file comes via multipart, not JSON
}

// ----- User DTOs -----
export interface UpdateUserRoleDTO {
  role: UserRole;
}

export interface UpdateProfileDTO {
  name?: string;
  email?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

// ----- Derived query result types -----
export type UserWithoutPassword = Omit<IUser, 'password'>;

export interface CourseWithInstructor extends ICourse {
  instructor: {
    name: string;
    email: string;
  };
}

export interface EnrollmentWithDetails extends IEnrollment {
  course_title: string;
  course_price: number;
  student_name: string;
  student_email: string;
}

export interface BookingWithDetails extends IBooking {
  course_title: string;
  instructor_name: string;
  instructor_id: number;
  slot_start_time: Date;
  slot_end_time: Date;
  student_name: string;
  student_email: string;
}
