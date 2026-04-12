import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserRole } from '@/types';
import type { IBooking, ITimeSlot, ICourse } from '@/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = new Date('2026-04-12T12:00:00Z');
const FUTURE = new Date('2026-04-15T10:00:00Z');
const PAST = new Date('2026-04-10T10:00:00Z');

const makeSlot = (overrides: Partial<ITimeSlot> = {}): ITimeSlot => ({
  id: 1,
  course_id: 10,
  start_time: FUTURE,
  end_time: new Date(FUTURE.getTime() + 60 * 60 * 1000),
  is_available: true,
  booked_by: null,
  created_at: NOW,
  ...overrides,
});

const makeCourse = (overrides: Partial<ICourse> = {}): ICourse => ({
  id: 10,
  title: 'Tajweed Basics',
  description: null,
  instructor_id: 50,
  price: 200,
  image_url: null,
  status: 'published',
  slot_duration: 60,
  price_per_slot: 150,
  meeting_platform: 'zoom',
  meeting_link: null,
  currency: 'EGP',
  created_at: NOW,
  ...overrides,
});

const makeBooking = (overrides: Partial<IBooking> = {}): IBooking => ({
  id: 100,
  user_id: 1,
  course_id: 10,
  slot_id: 1,
  payment_status: 'pending',
  payment_method: 'paymob_card',
  payment_id: null,
  transaction_id: null,
  amount: 150,
  meeting_link: null,
  meeting_id: null,
  meeting_platform: 'zoom',
  status: 'pending_payment',
  booked_at: NOW,
  cancelled_at: null,
  instapay_reference: null,
  payment_proof_path: null,
  payment_proof_uploaded_at: null,
  admin_notes: null,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockConn = { query: vi.fn() } as any;

vi.mock('@/lib/db/models/TimeSlot', () => ({
  TimeSlot: {
    findById: vi.fn(),
    lockForBooking: vi.fn(),
    markHeld: vi.fn(),
    release: vi.fn(),
  },
}));

vi.mock('@/lib/db/models/Booking', () => ({
  Booking: {
    findById: vi.fn(),
    lockById: vi.fn(),
    findByUser: vi.fn(),
    findByInstructor: vi.fn(),
    findForAdmin: vi.fn(),
    create: vi.fn(),
    updateFields: vi.fn(),
  },
}));

vi.mock('@/lib/db/models/Course', () => ({
  Course: {
    findById: vi.fn(),
  },
}));

// Mock withTransaction to execute the callback with our fake conn
vi.mock('@/lib/db/transaction', () => ({
  withTransaction: vi.fn(async (fn: (conn: any) => Promise<any>) => fn(mockConn)),
  isDuplicateEntryError: vi.fn(
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'errno' in error &&
      (error as any).errno === 1062
  ),
}));

// Import mocked modules
const { TimeSlot } = await import('@/lib/db/models/TimeSlot');
const { Booking } = await import('@/lib/db/models/Booking');
const { Course } = await import('@/lib/db/models/Course');

// Import service under test (after mocks are in place)
const { BookingService } = await import('@/lib/services/bookingService');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Freeze Date.now for consistent "is in the past" checks
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================================================================
  // initiateBooking
  // =========================================================================
  describe('initiateBooking', () => {
    it('creates a booking and holds the slot for a card payment', async () => {
      const slot = makeSlot();
      const course = makeCourse();
      const booking = makeBooking();

      vi.mocked(TimeSlot.findById).mockResolvedValue(slot);
      vi.mocked(Course.findById).mockResolvedValue(course);
      vi.mocked(TimeSlot.lockForBooking).mockResolvedValue(slot);
      vi.mocked(Booking.create).mockResolvedValue(booking);
      vi.mocked(TimeSlot.markHeld).mockResolvedValue(true);

      const result = await BookingService.initiateBooking(1, 1, 'paymob_card');

      expect(result).toEqual(booking);
      expect(Booking.create).toHaveBeenCalledWith(mockConn, {
        user_id: 1,
        course_id: 10,
        slot_id: 1,
        amount: 150,
        payment_method: 'paymob_card',
        status: 'pending_payment',
      });
      expect(TimeSlot.markHeld).toHaveBeenCalledWith(mockConn, 1, 1);
    });

    it('creates a booking with pending_review for instapay', async () => {
      const slot = makeSlot();
      const course = makeCourse();
      const booking = makeBooking({ status: 'pending_review', payment_method: 'instapay' });

      vi.mocked(TimeSlot.findById).mockResolvedValue(slot);
      vi.mocked(Course.findById).mockResolvedValue(course);
      vi.mocked(TimeSlot.lockForBooking).mockResolvedValue(slot);
      vi.mocked(Booking.create).mockResolvedValue(booking);
      vi.mocked(TimeSlot.markHeld).mockResolvedValue(true);

      const result = await BookingService.initiateBooking(1, 1, 'instapay');

      expect(result.status).toBe('pending_review');
      expect(Booking.create).toHaveBeenCalledWith(
        mockConn,
        expect.objectContaining({ status: 'pending_review', payment_method: 'instapay' })
      );
    });

    it('throws 404 when slot does not exist', async () => {
      vi.mocked(TimeSlot.findById).mockResolvedValue(null);

      await expect(
        BookingService.initiateBooking(1, 999, 'paymob_card')
      ).rejects.toThrow('Time slot not found');
    });

    it('throws 409 when slot is not available (pre-flight)', async () => {
      vi.mocked(TimeSlot.findById).mockResolvedValue(makeSlot({ is_available: false }));

      await expect(
        BookingService.initiateBooking(1, 1, 'paymob_card')
      ).rejects.toThrow('no longer available');
    });

    it('throws 400 when slot is in the past', async () => {
      vi.mocked(TimeSlot.findById).mockResolvedValue(makeSlot({ start_time: PAST }));

      await expect(
        BookingService.initiateBooking(1, 1, 'paymob_card')
      ).rejects.toThrow('past');
    });

    it('throws 404 when course does not exist', async () => {
      vi.mocked(TimeSlot.findById).mockResolvedValue(makeSlot());
      vi.mocked(Course.findById).mockResolvedValue(null);

      await expect(
        BookingService.initiateBooking(1, 1, 'paymob_card')
      ).rejects.toThrow('Course not found');
    });

    it('throws 400 when course is not published', async () => {
      vi.mocked(TimeSlot.findById).mockResolvedValue(makeSlot());
      vi.mocked(Course.findById).mockResolvedValue(makeCourse({ status: 'draft' }));

      await expect(
        BookingService.initiateBooking(1, 1, 'paymob_card')
      ).rejects.toThrow('not published');
    });

    it('throws 409 when slot is unavailable inside the transaction (race)', async () => {
      vi.mocked(TimeSlot.findById).mockResolvedValue(makeSlot());
      vi.mocked(Course.findById).mockResolvedValue(makeCourse());
      vi.mocked(TimeSlot.lockForBooking).mockResolvedValue(
        makeSlot({ is_available: false })
      );

      await expect(
        BookingService.initiateBooking(1, 1, 'paymob_card')
      ).rejects.toThrow('no longer available');
    });

    it('maps ER_DUP_ENTRY to 409 for concurrent slot bookings', async () => {
      vi.mocked(TimeSlot.findById).mockResolvedValue(makeSlot());
      vi.mocked(Course.findById).mockResolvedValue(makeCourse());
      vi.mocked(TimeSlot.lockForBooking).mockResolvedValue(makeSlot());

      const dupError = Object.assign(new Error('Duplicate entry'), { errno: 1062 });
      vi.mocked(Booking.create).mockRejectedValue(dupError);

      await expect(
        BookingService.initiateBooking(1, 1, 'paymob_card')
      ).rejects.toThrow('already been booked');
    });

    it('re-throws non-duplicate errors as-is', async () => {
      vi.mocked(TimeSlot.findById).mockResolvedValue(makeSlot());
      vi.mocked(Course.findById).mockResolvedValue(makeCourse());
      vi.mocked(TimeSlot.lockForBooking).mockResolvedValue(makeSlot());

      const genericError = new Error('Connection lost');
      vi.mocked(Booking.create).mockRejectedValue(genericError);

      await expect(
        BookingService.initiateBooking(1, 1, 'paymob_card')
      ).rejects.toThrow('Connection lost');
    });
  });

  // =========================================================================
  // getBookingById
  // =========================================================================
  describe('getBookingById', () => {
    it('returns booking for the owning student', async () => {
      const booking = makeBooking({ user_id: 5 });
      vi.mocked(Booking.findById).mockResolvedValue(booking);

      const result = await BookingService.getBookingById(100, 5, UserRole.STUDENT);
      expect(result).toEqual(booking);
    });

    it('returns booking for admin regardless of ownership', async () => {
      const booking = makeBooking({ user_id: 5 });
      vi.mocked(Booking.findById).mockResolvedValue(booking);

      const result = await BookingService.getBookingById(100, 999, UserRole.ADMIN);
      expect(result).toEqual(booking);
    });

    it('returns booking for the course instructor', async () => {
      const booking = makeBooking({ user_id: 5, course_id: 10 });
      vi.mocked(Booking.findById).mockResolvedValue(booking);
      vi.mocked(Course.findById).mockResolvedValue(makeCourse({ instructor_id: 50 }));

      const result = await BookingService.getBookingById(100, 50, UserRole.INSTRUCTOR);
      expect(result).toEqual(booking);
    });

    it('throws 404 when booking does not exist', async () => {
      vi.mocked(Booking.findById).mockResolvedValue(null);

      await expect(
        BookingService.getBookingById(999, 1, UserRole.STUDENT)
      ).rejects.toThrow('Booking not found');
    });

    it('throws 403 when student does not own the booking', async () => {
      vi.mocked(Booking.findById).mockResolvedValue(makeBooking({ user_id: 5 }));

      await expect(
        BookingService.getBookingById(100, 999, UserRole.STUDENT)
      ).rejects.toThrow('Not authorized');
    });

    it('throws 403 when instructor does not own the course', async () => {
      vi.mocked(Booking.findById).mockResolvedValue(makeBooking({ course_id: 10 }));
      vi.mocked(Course.findById).mockResolvedValue(makeCourse({ instructor_id: 50 }));

      await expect(
        BookingService.getBookingById(100, 999, UserRole.INSTRUCTOR)
      ).rejects.toThrow('Not authorized');
    });
  });

  // =========================================================================
  // List methods (thin delegation — mainly verify passthrough)
  // =========================================================================
  describe('listForStudent', () => {
    it('delegates to Booking.findByUser', async () => {
      vi.mocked(Booking.findByUser).mockResolvedValue([]);
      const result = await BookingService.listForStudent(1, 'confirmed');
      expect(Booking.findByUser).toHaveBeenCalledWith(1, 'confirmed');
      expect(result).toEqual([]);
    });
  });

  describe('listForInstructor', () => {
    it('delegates to Booking.findByInstructor', async () => {
      vi.mocked(Booking.findByInstructor).mockResolvedValue([]);
      const result = await BookingService.listForInstructor(50);
      expect(Booking.findByInstructor).toHaveBeenCalledWith(50);
      expect(result).toEqual([]);
    });
  });

  describe('listForAdmin', () => {
    it('delegates to Booking.findForAdmin with filters', async () => {
      vi.mocked(Booking.findForAdmin).mockResolvedValue([]);
      const filters = { status: 'pending_review' as const, limit: 10, offset: 0 };
      const result = await BookingService.listForAdmin(filters);
      expect(Booking.findForAdmin).toHaveBeenCalledWith(filters);
      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // confirmBooking
  // =========================================================================
  describe('confirmBooking', () => {
    it('transitions pending_payment booking to confirmed', async () => {
      const booking = makeBooking({ status: 'pending_payment' });
      const confirmed = makeBooking({ status: 'confirmed', payment_status: 'paid' });

      vi.mocked(Booking.lockById).mockResolvedValue(booking);
      vi.mocked(Booking.updateFields).mockResolvedValue(true);
      vi.mocked(Booking.findById).mockResolvedValue(confirmed);

      const result = await BookingService.confirmBooking(100, {
        payment_id: 'pay_123',
        transaction_id: 'txn_456',
      });

      expect(result.status).toBe('confirmed');
      expect(Booking.updateFields).toHaveBeenCalledWith(
        mockConn,
        100,
        expect.objectContaining({
          status: 'confirmed',
          payment_status: 'paid',
          payment_id: 'pay_123',
          transaction_id: 'txn_456',
        })
      );
    });

    it('transitions pending_review booking to confirmed', async () => {
      const booking = makeBooking({ status: 'pending_review', payment_method: 'instapay' });
      const confirmed = makeBooking({ status: 'confirmed', payment_status: 'paid' });

      vi.mocked(Booking.lockById).mockResolvedValue(booking);
      vi.mocked(Booking.updateFields).mockResolvedValue(true);
      vi.mocked(Booking.findById).mockResolvedValue(confirmed);

      const result = await BookingService.confirmBooking(100, {
        admin_notes: 'InstaPay proof verified',
      });

      expect(result.status).toBe('confirmed');
      expect(Booking.updateFields).toHaveBeenCalledWith(
        mockConn,
        100,
        expect.objectContaining({
          status: 'confirmed',
          payment_status: 'paid',
          admin_notes: 'InstaPay proof verified',
        })
      );
    });

    it('is idempotent — returns already-confirmed booking without error', async () => {
      const confirmed = makeBooking({ status: 'confirmed' });
      vi.mocked(Booking.lockById).mockResolvedValue(confirmed);

      const result = await BookingService.confirmBooking(100);

      expect(result.status).toBe('confirmed');
      expect(Booking.updateFields).not.toHaveBeenCalled();
    });

    it('throws 404 when booking does not exist', async () => {
      vi.mocked(Booking.lockById).mockResolvedValue(null);

      await expect(BookingService.confirmBooking(999)).rejects.toThrow('Booking not found');
    });

    it('throws 400 when booking is in a terminal state (cancelled)', async () => {
      vi.mocked(Booking.lockById).mockResolvedValue(makeBooking({ status: 'cancelled' }));

      await expect(BookingService.confirmBooking(100)).rejects.toThrow(
        "Cannot confirm a booking with status 'cancelled'"
      );
    });

    it('throws 400 when booking is completed', async () => {
      vi.mocked(Booking.lockById).mockResolvedValue(makeBooking({ status: 'completed' }));

      await expect(BookingService.confirmBooking(100)).rejects.toThrow(
        "Cannot confirm a booking with status 'completed'"
      );
    });

    it('does not include undefined metadata fields in the update patch', async () => {
      const booking = makeBooking({ status: 'pending_payment' });
      const confirmed = makeBooking({ status: 'confirmed', payment_status: 'paid' });

      vi.mocked(Booking.lockById).mockResolvedValue(booking);
      vi.mocked(Booking.updateFields).mockResolvedValue(true);
      vi.mocked(Booking.findById).mockResolvedValue(confirmed);

      await BookingService.confirmBooking(100);

      // The patch should only have status + payment_status (no payment_id, etc.)
      const patch = vi.mocked(Booking.updateFields).mock.calls[0][2];
      expect(patch).toEqual({ status: 'confirmed', payment_status: 'paid' });
    });
  });

  // =========================================================================
  // cancelBooking
  // =========================================================================
  describe('cancelBooking', () => {
    it('cancels a pending_payment booking and releases the slot', async () => {
      const booking = makeBooking({ status: 'pending_payment', user_id: 1 });
      const cancelled = makeBooking({ status: 'cancelled', cancelled_at: NOW });

      vi.mocked(Booking.lockById).mockResolvedValue(booking);
      vi.mocked(Booking.updateFields).mockResolvedValue(true);
      vi.mocked(TimeSlot.release).mockResolvedValue(true);
      vi.mocked(Booking.findById).mockResolvedValue(cancelled);

      const result = await BookingService.cancelBooking(100, 1, UserRole.STUDENT);

      expect(result.status).toBe('cancelled');
      expect(Booking.updateFields).toHaveBeenCalledWith(
        mockConn,
        100,
        expect.objectContaining({ status: 'cancelled' })
      );
      expect(TimeSlot.release).toHaveBeenCalledWith(mockConn, 1);
    });

    it('allows admin to cancel a confirmed booking', async () => {
      const booking = makeBooking({ status: 'confirmed', user_id: 1 });
      const cancelled = makeBooking({ status: 'cancelled' });

      vi.mocked(Booking.lockById).mockResolvedValue(booking);
      vi.mocked(Booking.updateFields).mockResolvedValue(true);
      vi.mocked(TimeSlot.release).mockResolvedValue(true);
      vi.mocked(Booking.findById).mockResolvedValue(cancelled);

      const result = await BookingService.cancelBooking(100, 999, UserRole.ADMIN);
      expect(result.status).toBe('cancelled');
    });

    it('allows instructor to cancel a confirmed booking on their course', async () => {
      const booking = makeBooking({ status: 'confirmed', course_id: 10 });
      const cancelled = makeBooking({ status: 'cancelled' });

      vi.mocked(Booking.lockById).mockResolvedValue(booking);
      vi.mocked(Course.findById).mockResolvedValue(makeCourse({ instructor_id: 50 }));
      vi.mocked(Booking.updateFields).mockResolvedValue(true);
      vi.mocked(TimeSlot.release).mockResolvedValue(true);
      vi.mocked(Booking.findById).mockResolvedValue(cancelled);

      const result = await BookingService.cancelBooking(100, 50, UserRole.INSTRUCTOR);
      expect(result.status).toBe('cancelled');
    });

    it('throws 404 when booking does not exist', async () => {
      vi.mocked(Booking.lockById).mockResolvedValue(null);

      await expect(
        BookingService.cancelBooking(999, 1, UserRole.ADMIN)
      ).rejects.toThrow('Booking not found');
    });

    it('throws 400 when booking is already cancelled', async () => {
      vi.mocked(Booking.lockById).mockResolvedValue(makeBooking({ status: 'cancelled' }));

      await expect(
        BookingService.cancelBooking(100, 1, UserRole.ADMIN)
      ).rejects.toThrow("Cannot cancel a booking with status 'cancelled'");
    });

    it('throws 400 when booking is completed', async () => {
      vi.mocked(Booking.lockById).mockResolvedValue(makeBooking({ status: 'completed' }));

      await expect(
        BookingService.cancelBooking(100, 1, UserRole.ADMIN)
      ).rejects.toThrow("Cannot cancel a booking with status 'completed'");
    });

    it('throws 400 when booking is no_show', async () => {
      vi.mocked(Booking.lockById).mockResolvedValue(makeBooking({ status: 'no_show' }));

      await expect(
        BookingService.cancelBooking(100, 1, UserRole.ADMIN)
      ).rejects.toThrow("Cannot cancel a booking with status 'no_show'");
    });

    it('prevents student from cancelling confirmed booking', async () => {
      vi.mocked(Booking.lockById).mockResolvedValue(
        makeBooking({ status: 'confirmed', user_id: 1 })
      );

      await expect(
        BookingService.cancelBooking(100, 1, UserRole.STUDENT)
      ).rejects.toThrow('contact support');
    });

    it('prevents student from cancelling another users booking', async () => {
      vi.mocked(Booking.lockById).mockResolvedValue(
        makeBooking({ status: 'pending_payment', user_id: 5 })
      );

      await expect(
        BookingService.cancelBooking(100, 999, UserRole.STUDENT)
      ).rejects.toThrow('Not authorized');
    });

    it('prevents instructor from cancelling booking on another instructors course', async () => {
      vi.mocked(Booking.lockById).mockResolvedValue(
        makeBooking({ status: 'confirmed', course_id: 10 })
      );
      vi.mocked(Course.findById).mockResolvedValue(makeCourse({ instructor_id: 50 }));

      await expect(
        BookingService.cancelBooking(100, 999, UserRole.INSTRUCTOR)
      ).rejects.toThrow('Not authorized');
    });
  });
});
