import { Booking, type CreateBookingRow } from '@/lib/db/models/Booking';
import { TimeSlot } from '@/lib/db/models/TimeSlot';
import { Course } from '@/lib/db/models/Course';
import { withTransaction, isDuplicateEntryError } from '@/lib/db/transaction';
import { ApiError, ApiErrorCode } from '@/lib/api/errors';
import type {
  IBooking,
  BookingWithDetails,
  BookingStatus,
  PaymentMethod,
  UserRole,
} from '@/types';
import { UserRole as Roles } from '@/types';

/**
 * Booking Service — core orchestrator for the Mihraby booking lifecycle.
 *
 * Owns: slot hold initiation, status transitions, cancellation + slot release,
 * and role-based read access. Payment confirmation (Paymob webhook, InstaPay
 * admin approval) both funnel through `confirmBooking` so the state machine
 * has exactly one code path.
 *
 * All multi-row mutations run inside `withTransaction`. Models receive the
 * `PoolConnection` so they participate in the same transaction.
 */
export class BookingService {
  // ---------------------------------------------------------------------------
  // Initiate booking (hold a slot)
  // ---------------------------------------------------------------------------

  /**
   * Create a booking and hold the slot in a single transaction.
   *
   * 1. Quick pre-flight check (outside txn) to fail fast on obviously-bad data.
   * 2. Inside a transaction: `SELECT … FOR UPDATE` the slot, re-verify
   *    availability, INSERT booking, mark slot as held.
   * 3. If a concurrent booking lands on the same slot, the `UNIQUE(slot_hold)`
   *    generated column triggers `ER_DUP_ENTRY` (MySQL 1062) — mapped to 409.
   */
  static async initiateBooking(
    userId: number,
    slotId: number,
    paymentMethod: PaymentMethod
  ): Promise<IBooking> {
    // -- Pre-flight (cheap reads on the pool, no lock) --
    const slot = await TimeSlot.findById(slotId);
    if (!slot) {
      throw new ApiError('Time slot not found', 404, ApiErrorCode.NOT_FOUND);
    }
    if (!slot.is_available) {
      throw new ApiError('Time slot is no longer available', 409, ApiErrorCode.VALIDATION_ERROR);
    }
    if (new Date(slot.start_time).getTime() <= Date.now()) {
      throw new ApiError('Cannot book a slot in the past', 400, ApiErrorCode.VALIDATION_ERROR);
    }

    const course = await Course.findById(slot.course_id);
    if (!course) {
      throw new ApiError('Course not found', 404, ApiErrorCode.NOT_FOUND);
    }
    if (course.status !== 'published') {
      throw new ApiError('Course is not published', 400, ApiErrorCode.VALIDATION_ERROR);
    }

    const amount = Number(course.price_per_slot);
    const bookingStatus: BookingStatus =
      paymentMethod === 'instapay' ? 'pending_review' : 'pending_payment';

    // -- Transactional insert --
    try {
      return await withTransaction(async (conn) => {
        const lockedSlot = await TimeSlot.lockForBooking(conn, slotId);
        if (!lockedSlot || !lockedSlot.is_available) {
          throw new ApiError(
            'Time slot is no longer available',
            409,
            ApiErrorCode.VALIDATION_ERROR
          );
        }

        const row: CreateBookingRow = {
          user_id: userId,
          course_id: slot.course_id,
          slot_id: slotId,
          amount,
          payment_method: paymentMethod,
          status: bookingStatus,
        };

        const booking = await Booking.create(conn, row);
        await TimeSlot.markHeld(conn, slotId, userId);
        return booking;
      });
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new ApiError(
          'This slot has already been booked',
          409,
          ApiErrorCode.VALIDATION_ERROR
        );
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Read (role-aware)
  // ---------------------------------------------------------------------------

  /**
   * Fetch a single booking. Enforces that the requester is the student who
   * owns the booking, the instructor whose course it belongs to, or an admin.
   */
  static async getBookingById(
    bookingId: number,
    requesterId: number,
    requesterRole: UserRole
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
    }

    if (requesterRole === Roles.ADMIN) {
      return booking;
    }

    if (requesterRole === Roles.STUDENT && booking.user_id === requesterId) {
      return booking;
    }

    // For instructors, verify they own the course.
    if (requesterRole === Roles.INSTRUCTOR) {
      const course = await Course.findById(booking.course_id);
      if (course && course.instructor_id === requesterId) {
        return booking;
      }
    }

    throw new ApiError('Not authorized to view this booking', 403, ApiErrorCode.FORBIDDEN);
  }

  static async listForStudent(
    userId: number,
    status?: BookingStatus
  ): Promise<BookingWithDetails[]> {
    return Booking.findByUser(userId, status);
  }

  static async listForInstructor(instructorId: number): Promise<BookingWithDetails[]> {
    return Booking.findByInstructor(instructorId);
  }

  static async listForAdmin(filters?: {
    status?: BookingStatus;
    limit?: number;
    offset?: number;
  }): Promise<BookingWithDetails[]> {
    return Booking.findForAdmin(filters);
  }

  // ---------------------------------------------------------------------------
  // Confirm booking (shared path for Paymob webhook + InstaPay admin approval)
  // ---------------------------------------------------------------------------

  /**
   * Transition a booking to `confirmed`. Called by:
   *   - Paymob webhook handler (after successful payment)
   *   - Admin InstaPay approval endpoint
   *
   * The method is idempotent: if the booking is already confirmed it returns
   * the existing row without error (webhook replays are harmless).
   *
   * @param metadata  Optional payment/admin metadata to stamp on the booking.
   */
  static async confirmBooking(
    bookingId: number,
    metadata?: {
      payment_id?: string;
      transaction_id?: string;
      admin_notes?: string;
    }
  ): Promise<IBooking> {
    return withTransaction(async (conn) => {
      const booking = await Booking.lockById(conn, bookingId);
      if (!booking) {
        throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
      }

      // Idempotent: already confirmed → no-op
      if (booking.status === 'confirmed') {
        return booking;
      }

      // Only pending_payment and pending_review can transition to confirmed
      if (booking.status !== 'pending_payment' && booking.status !== 'pending_review') {
        throw new ApiError(
          `Cannot confirm a booking with status '${booking.status}'`,
          400,
          ApiErrorCode.VALIDATION_ERROR
        );
      }

      await Booking.updateFields(conn, bookingId, {
        status: 'confirmed',
        payment_status: 'paid',
        ...(metadata?.payment_id && { payment_id: metadata.payment_id }),
        ...(metadata?.transaction_id && { transaction_id: metadata.transaction_id }),
        ...(metadata?.admin_notes && { admin_notes: metadata.admin_notes }),
      });

      const updated = await Booking.findById(bookingId, conn);
      if (!updated) {
        throw new ApiError('Failed to reload booking after confirmation', 500);
      }
      return updated;
    });
  }

  // ---------------------------------------------------------------------------
  // Cancel booking + release slot
  // ---------------------------------------------------------------------------

  /**
   * Cancel a booking and release the held slot back to available.
   *
   * Allowed callers:
   *   - The student who owns the booking (pending_payment / pending_review only)
   *   - An admin (any cancellable status)
   *   - The hold-expiry cron (system-level, caller passes admin role)
   *
   * Confirmed bookings can only be cancelled by admins (student must contact
   * support — per MVP scope decision).
   */
  static async cancelBooking(
    bookingId: number,
    cancelledById: number,
    cancellerRole: UserRole
  ): Promise<IBooking> {
    return withTransaction(async (conn) => {
      const booking = await Booking.lockById(conn, bookingId);
      if (!booking) {
        throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
      }

      // Terminal states — can't cancel
      if (
        booking.status === 'cancelled' ||
        booking.status === 'completed' ||
        booking.status === 'no_show'
      ) {
        throw new ApiError(
          `Cannot cancel a booking with status '${booking.status}'`,
          400,
          ApiErrorCode.VALIDATION_ERROR
        );
      }

      // Students can only cancel their own pre-confirmed bookings
      if (cancellerRole === Roles.STUDENT) {
        if (booking.user_id !== cancelledById) {
          throw new ApiError(
            'Not authorized to cancel this booking',
            403,
            ApiErrorCode.FORBIDDEN
          );
        }
        if (booking.status === 'confirmed') {
          throw new ApiError(
            'Confirmed bookings cannot be cancelled by students — please contact support',
            400,
            ApiErrorCode.VALIDATION_ERROR
          );
        }
      }

      // Instructors can cancel confirmed bookings on their own courses
      if (cancellerRole === Roles.INSTRUCTOR) {
        const course = await Course.findById(booking.course_id);
        if (!course || course.instructor_id !== cancelledById) {
          throw new ApiError(
            'Not authorized to cancel this booking',
            403,
            ApiErrorCode.FORBIDDEN
          );
        }
      }

      await Booking.updateFields(conn, bookingId, {
        status: 'cancelled',
        cancelled_at: new Date(),
      });

      await TimeSlot.release(conn, booking.slot_id);

      const updated = await Booking.findById(bookingId, conn);
      if (!updated) {
        throw new ApiError('Failed to reload booking after cancellation', 500);
      }
      return updated;
    });
  }
}

export default BookingService;
