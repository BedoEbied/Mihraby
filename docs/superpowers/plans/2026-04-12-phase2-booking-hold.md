# Phase 2: Booking Hold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable students to book a time slot (hold it), choose a payment method, and see their bookings. Concurrent booking protection testable via curl.

**Architecture:** BookingService orchestrates slot locking + booking creation inside a single DB transaction. The `UNIQUE(slot_hold)` generated column on the bookings table provides database-level double-booking prevention. Frontend hooks (`useInitiateBooking`) are already scaffolded — we wire them to real routes and build the payment-method selection page (buttons stubbed, real payment in Phase 3).

**Tech Stack:** Next.js 16 App Router, mysql2 transactions, Zod validation, React Query, TanStack

---

## File Structure

### New files to create
| File | Responsibility |
|------|---------------|
| `lib/services/bookingService.ts` | Core booking orchestration: initiate, cancel, list, confirm (stubbed) |
| `app/api/bookings/initiate/route.ts` | POST — student initiates booking |
| `app/api/bookings/[id]/route.ts` | GET — fetch single booking detail |
| `app/api/bookings/[id]/cancel/route.ts` | PUT — student cancels pending booking |
| `app/api/student/bookings/route.ts` | GET — list student's own bookings |
| `app/api/instructor/bookings/route.ts` | GET — list instructor's bookings |
| `app/(dashboard)/student/bookings/page.tsx` | Student bookings list page |
| `tests/unit/bookingService.test.ts` | Unit tests for BookingService |

### Existing files to modify
| File | Change |
|------|--------|
| `lib/validators/booking.ts` | Replace `createBookingSchema` with `initiateBookingSchema` matching `InitiateBookingDTO` |
| `features/bookings/api/use-bookings.ts` | Fix `useInitiateBooking` to unwrap `ApiResponse` envelope, invalidate slot queries, add `useBookingDetail` hook |
| `features/bookings/components/my-bookings.tsx` | Replace placeholder with real booking list |
| `features/bookings/components/booking-cart.tsx` | Replace placeholder with payment method selector |
| `features/bookings/components/index.ts` | Export real components |
| `app/(dashboard)/student/courses/[id]/student-course-detail.tsx` | Replace "Enroll" section with "Book this slot" using `useInitiateBooking` |
| `app/(dashboard)/student/layout.tsx` | Add "My Bookings" nav link |

---

## Task 1: BookingService — initiateBooking

**Files:**
- Create: `lib/services/bookingService.ts`
- Test: `tests/unit/bookingService.test.ts`

### Reuse (do NOT rewrite):
- `lib/db/models/Booking.ts` — `Booking.create(conn, data)`, `Booking.findById(id, conn)`
- `lib/db/models/TimeSlot.ts` — `TimeSlot.lockForBooking(conn, id)`, `TimeSlot.markHeld(conn, slotId, userId)`
- `lib/db/models/Course.ts` — `Course.findById(courseId)`
- `lib/db/transaction.ts` — `withTransaction()`, `isDuplicateEntryError()`
- `lib/api/errors.ts` — `ApiError`, `ApiErrorCode`
- `types/index.ts` — `InitiateBookingDTO`, `IBooking`, `BookingStatus`, `PaymentMethod`

- [ ] **Step 1: Write the failing test for initiateBooking happy path**

Create `tests/unit/bookingService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB models and transaction helper
vi.mock('@/lib/db/models/TimeSlot', () => ({
  TimeSlot: {
    lockForBooking: vi.fn(),
    markHeld: vi.fn(),
  },
}));

vi.mock('@/lib/db/models/Booking', () => ({
  Booking: {
    create: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('@/lib/db/models/Course', () => ({
  Course: {
    findById: vi.fn(),
  },
}));

// Capture the callback passed to withTransaction and invoke it with a fake conn
const fakeConn = {} as any;
vi.mock('@/lib/db/transaction', () => ({
  withTransaction: vi.fn(async (fn: (conn: any) => Promise<any>) => fn(fakeConn)),
  isDuplicateEntryError: vi.fn((err: any) => err?.errno === 1062),
}));

import { BookingService } from '@/lib/services/bookingService';
import { TimeSlot } from '@/lib/db/models/TimeSlot';
import { Booking } from '@/lib/db/models/Booking';
import { Course } from '@/lib/db/models/Course';

describe('BookingService.initiateBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a booking and holds the slot', async () => {
    const mockCourse = { id: 1, instructor_id: 10, price_per_slot: 100 };
    const mockSlot = { id: 5, course_id: 1, is_available: true, start_time: new Date('2026-05-01T10:00:00Z') };
    const mockBooking = { id: 99, slot_id: 5, status: 'pending_payment' };

    vi.mocked(Course.findById).mockResolvedValue(mockCourse as any);
    vi.mocked(TimeSlot.lockForBooking).mockResolvedValue(mockSlot as any);
    vi.mocked(TimeSlot.markHeld).mockResolvedValue(true);
    vi.mocked(Booking.create).mockResolvedValue(mockBooking as any);

    const result = await BookingService.initiateBooking(
      2,                // userId (student)
      { slot_id: 5, payment_method: 'paymob_card' }
    );

    expect(result).toEqual(mockBooking);
    expect(TimeSlot.lockForBooking).toHaveBeenCalledWith(fakeConn, 5);
    expect(TimeSlot.markHeld).toHaveBeenCalledWith(fakeConn, 5, 2);
    expect(Booking.create).toHaveBeenCalledWith(fakeConn, {
      user_id: 2,
      course_id: 1,
      slot_id: 5,
      amount: 100,
      payment_method: 'paymob_card',
      status: 'pending_payment',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/bookingService.test.ts`
Expected: FAIL — `Cannot find module '@/lib/services/bookingService'`

- [ ] **Step 3: Write BookingService.initiateBooking**

Create `lib/services/bookingService.ts`:

```typescript
import { Booking, CreateBookingRow } from '@/lib/db/models/Booking';
import { TimeSlot } from '@/lib/db/models/TimeSlot';
import { Course } from '@/lib/db/models/Course';
import { withTransaction, isDuplicateEntryError } from '@/lib/db/transaction';
import { ApiError, ApiErrorCode } from '@/lib/api/errors';
import type { IBooking, InitiateBookingDTO, BookingStatus } from '@/types';

export class BookingService {
  /**
   * Initiate a booking: lock the slot, verify availability, create the
   * booking, and mark the slot as held — all in one transaction.
   *
   * If two students race for the same slot, the UNIQUE(slot_hold) index
   * catches the second INSERT and we return 409.
   */
  static async initiateBooking(
    userId: number,
    dto: InitiateBookingDTO
  ): Promise<IBooking> {
    // Load course to get price_per_slot — outside transaction (read-only)
    const slot = await TimeSlot.findById(dto.slot_id);
    if (!slot) {
      throw new ApiError('Time slot not found', 404, ApiErrorCode.NOT_FOUND);
    }

    const course = await Course.findById(slot.course_id);
    if (!course) {
      throw new ApiError('Course not found', 404, ApiErrorCode.NOT_FOUND);
    }

    if (!course.price_per_slot || Number(course.price_per_slot) <= 0) {
      throw new ApiError('Course has no price configured', 400, ApiErrorCode.VALIDATION_ERROR);
    }

    // Check slot is in the future
    if (new Date(slot.start_time).getTime() <= Date.now()) {
      throw new ApiError('Cannot book a slot in the past', 400, ApiErrorCode.VALIDATION_ERROR);
    }

    try {
      return await withTransaction(async (conn) => {
        // Lock the slot row to prevent concurrent reads
        const locked = await TimeSlot.lockForBooking(conn, dto.slot_id);
        if (!locked || !locked.is_available) {
          throw new ApiError(
            'This time slot is no longer available',
            409,
            ApiErrorCode.VALIDATION_ERROR
          );
        }

        // Determine initial status based on payment method
        const status: BookingStatus =
          dto.payment_method === 'instapay' ? 'pending_review' : 'pending_payment';

        const bookingData: CreateBookingRow = {
          user_id: userId,
          course_id: slot.course_id,
          slot_id: dto.slot_id,
          amount: Number(course.price_per_slot),
          payment_method: dto.payment_method,
          status,
        };

        const booking = await Booking.create(conn, bookingData);

        // Mark the slot as held
        const held = await TimeSlot.markHeld(conn, dto.slot_id, userId);
        if (!held) {
          throw new ApiError(
            'Failed to hold slot — it may have been taken',
            409,
            ApiErrorCode.VALIDATION_ERROR
          );
        }

        return booking;
      });
    } catch (error) {
      // The UNIQUE(slot_hold) constraint fires when two concurrent
      // transactions both try to hold the same slot.
      if (isDuplicateEntryError(error)) {
        throw new ApiError(
          'This time slot was just booked by another student',
          409,
          ApiErrorCode.VALIDATION_ERROR
        );
      }
      throw error;
    }
  }
}

export default BookingService;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/bookingService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/bookingService.ts tests/unit/bookingService.test.ts
git commit -m "feat(phase-2): add BookingService.initiateBooking with slot locking"
```

---

## Task 2: BookingService — slot-taken and duplicate-entry tests

**Files:**
- Modify: `tests/unit/bookingService.test.ts`

- [ ] **Step 1: Write failing test for slot-not-available**

Add to `tests/unit/bookingService.test.ts`:

```typescript
  it('rejects when slot is not available (already held)', async () => {
    const mockCourse = { id: 1, instructor_id: 10, price_per_slot: 100 };
    const mockSlot = { id: 5, course_id: 1, is_available: false, start_time: new Date('2026-05-01T10:00:00Z') };

    vi.mocked(Course.findById).mockResolvedValue(mockCourse as any);
    vi.mocked(TimeSlot.lockForBooking).mockResolvedValue(mockSlot as any);
    // Need findById for the pre-tx check
    vi.mocked(TimeSlot).findById = vi.fn().mockResolvedValue({ ...mockSlot, is_available: true } as any);

    await expect(
      BookingService.initiateBooking(2, { slot_id: 5, payment_method: 'paymob_card' })
    ).rejects.toThrow('no longer available');
  });

  it('maps ER_DUP_ENTRY to 409 when concurrent booking wins', async () => {
    const mockSlot = { id: 5, course_id: 1, is_available: true, start_time: new Date('2026-05-01T10:00:00Z') };
    const mockCourse = { id: 1, instructor_id: 10, price_per_slot: 100 };

    vi.mocked(Course.findById).mockResolvedValue(mockCourse as any);
    vi.mocked(TimeSlot).findById = vi.fn().mockResolvedValue(mockSlot as any);
    vi.mocked(TimeSlot.lockForBooking).mockResolvedValue(mockSlot as any);
    vi.mocked(TimeSlot.markHeld).mockResolvedValue(true);

    const dupError = Object.assign(new Error('Duplicate entry'), { errno: 1062 });
    vi.mocked(Booking.create).mockRejectedValue(dupError);

    // isDuplicateEntryError mock returns true for errno 1062
    await expect(
      BookingService.initiateBooking(2, { slot_id: 5, payment_method: 'paymob_card' })
    ).rejects.toThrow('just booked by another student');
  });

  it('sets status to pending_review for instapay', async () => {
    const mockSlot = { id: 5, course_id: 1, is_available: true, start_time: new Date('2026-05-01T10:00:00Z') };
    const mockCourse = { id: 1, instructor_id: 10, price_per_slot: 200 };
    const mockBooking = { id: 100, status: 'pending_review' };

    vi.mocked(Course.findById).mockResolvedValue(mockCourse as any);
    vi.mocked(TimeSlot).findById = vi.fn().mockResolvedValue(mockSlot as any);
    vi.mocked(TimeSlot.lockForBooking).mockResolvedValue(mockSlot as any);
    vi.mocked(TimeSlot.markHeld).mockResolvedValue(true);
    vi.mocked(Booking.create).mockResolvedValue(mockBooking as any);

    await BookingService.initiateBooking(2, { slot_id: 5, payment_method: 'instapay' });

    expect(Booking.create).toHaveBeenCalledWith(
      fakeConn,
      expect.objectContaining({ status: 'pending_review', payment_method: 'instapay' })
    );
  });
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/unit/bookingService.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 3: Commit**

```bash
git add tests/unit/bookingService.test.ts
git commit -m "test(phase-2): add edge-case tests for slot locking and instapay status"
```

---

## Task 3: BookingService — cancelBooking and listForStudent

**Files:**
- Modify: `lib/services/bookingService.ts`
- Modify: `tests/unit/bookingService.test.ts`

- [ ] **Step 1: Write failing tests for cancelBooking and listForStudent**

Add to `tests/unit/bookingService.test.ts`:

```typescript
import { Booking } from '@/lib/db/models/Booking';

// Add these mocks to the existing Booking mock at top:
// Booking.findByUser: vi.fn(),
// Booking.updateFields: vi.fn(),

describe('BookingService.cancelBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels a pending_payment booking and releases the slot', async () => {
    const mockBooking = { id: 10, user_id: 2, slot_id: 5, status: 'pending_payment' };

    vi.mocked(Booking.findById).mockResolvedValue(mockBooking as any);
    vi.mocked(Booking.updateFields).mockResolvedValue(true);
    vi.mocked(TimeSlot.release).mockResolvedValue(true);

    await BookingService.cancelBooking(10, 2);

    expect(Booking.updateFields).toHaveBeenCalledWith(
      fakeConn,
      10,
      expect.objectContaining({ status: 'cancelled' })
    );
    expect(TimeSlot.release).toHaveBeenCalledWith(fakeConn, 5);
  });

  it('rejects cancellation by a different user', async () => {
    const mockBooking = { id: 10, user_id: 2, slot_id: 5, status: 'pending_payment' };
    vi.mocked(Booking.findById).mockResolvedValue(mockBooking as any);

    await expect(
      BookingService.cancelBooking(10, 999)
    ).rejects.toThrow('Not authorized');
  });

  it('rejects cancellation of confirmed booking', async () => {
    const mockBooking = { id: 10, user_id: 2, slot_id: 5, status: 'confirmed' };
    vi.mocked(Booking.findById).mockResolvedValue(mockBooking as any);

    await expect(
      BookingService.cancelBooking(10, 2)
    ).rejects.toThrow('Cannot cancel');
  });
});

describe('BookingService.listForStudent', () => {
  it('delegates to Booking.findByUser', async () => {
    vi.mocked(Booking.findByUser).mockResolvedValue([]);
    const result = await BookingService.listForStudent(2);
    expect(Booking.findByUser).toHaveBeenCalledWith(2, undefined);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/bookingService.test.ts`
Expected: FAIL — methods don't exist on BookingService

- [ ] **Step 3: Implement cancelBooking and listForStudent**

Add to `lib/services/bookingService.ts`:

```typescript
  /**
   * Student cancels their own pending booking. Only `pending_payment` can be
   * cancelled by the student (confirmed bookings require support contact).
   */
  static async cancelBooking(bookingId: number, userId: number): Promise<void> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
    }
    if (booking.user_id !== userId) {
      throw new ApiError('Not authorized to cancel this booking', 403, ApiErrorCode.FORBIDDEN);
    }
    if (booking.status !== 'pending_payment' && booking.status !== 'pending_review') {
      throw new ApiError(
        'Cannot cancel a booking that is already confirmed or completed',
        400,
        ApiErrorCode.VALIDATION_ERROR
      );
    }

    await withTransaction(async (conn) => {
      await Booking.updateFields(conn, bookingId, {
        status: 'cancelled',
        cancelled_at: new Date(),
      });
      await TimeSlot.release(conn, booking.slot_id);
    });
  }

  /**
   * List the student's own bookings with course + slot details.
   */
  static async listForStudent(
    userId: number,
    status?: BookingStatus
  ): Promise<BookingWithDetails[]> {
    return Booking.findByUser(userId, status);
  }

  /**
   * List bookings for an instructor's courses.
   */
  static async listForInstructor(instructorId: number): Promise<BookingWithDetails[]> {
    return Booking.findByInstructor(instructorId);
  }

  /**
   * Get a single booking by ID. Caller must have access (student owner,
   * course instructor, or admin).
   */
  static async getById(
    bookingId: number,
    userId: number,
    userRole: string
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
    }
    if (userRole !== 'admin' && booking.user_id !== userId) {
      throw new ApiError('Not authorized', 403, ApiErrorCode.FORBIDDEN);
    }
    return booking;
  }

  /**
   * Confirm a booking. Shared path for Paymob webhook (Phase 3) and
   * admin InstaPay approval (Phase 4). Stubbed here to just flip status.
   */
  static async confirmBooking(
    bookingId: number,
    _metadata?: Record<string, unknown>
  ): Promise<IBooking> {
    return withTransaction(async (conn) => {
      const booking = await Booking.lockById(conn, bookingId);
      if (!booking) {
        throw new ApiError('Booking not found', 404, ApiErrorCode.NOT_FOUND);
      }
      if (booking.status === 'confirmed') {
        return booking; // idempotent
      }
      await Booking.updateFields(conn, bookingId, {
        status: 'confirmed',
        payment_status: 'paid',
      });
      const updated = await Booking.findById(bookingId, conn);
      return updated!;
    });
  }
```

Also add the import for `BookingWithDetails`:
```typescript
import type { IBooking, BookingWithDetails, InitiateBookingDTO, BookingStatus } from '@/types';
```

- [ ] **Step 4: Update mocks and run tests**

Update the Booking mock at the top of the test file to include `findByUser`, `updateFields`, and `lockById`:

```typescript
vi.mock('@/lib/db/models/Booking', () => ({
  Booking: {
    create: vi.fn(),
    findById: vi.fn(),
    findByUser: vi.fn(),
    updateFields: vi.fn(),
    lockById: vi.fn(),
  },
}));
```

Also add `release` to the TimeSlot mock:
```typescript
vi.mock('@/lib/db/models/TimeSlot', () => ({
  TimeSlot: {
    lockForBooking: vi.fn(),
    markHeld: vi.fn(),
    release: vi.fn(),
    findById: vi.fn(),
  },
}));
```

Run: `npx vitest run tests/unit/bookingService.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add lib/services/bookingService.ts tests/unit/bookingService.test.ts
git commit -m "feat(phase-2): add cancelBooking, listForStudent, confirmBooking (stubbed)"
```

---

## Task 4: Validator — initiateBookingSchema

**Files:**
- Modify: `lib/validators/booking.ts`

- [ ] **Step 1: Update the validator**

Replace `createBookingSchema` with `initiateBookingSchema` that matches `InitiateBookingDTO`:

```typescript
import { z } from 'zod';

const paymentMethodEnum = z.enum(['paymob_card', 'paymob_wallet', 'paymob_fawry', 'instapay']);

export const initiateBookingSchema = z.object({
  slot_id: z.number().int().positive('Slot ID is required'),
  payment_method: paymentMethodEnum,
});

export const createPaymentSchema = z.object({
  booking_id: z.number().int().positive(),
  amount: z.number().positive(),
  email: z.string().email(),
  phone: z.string().min(10),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']),
});

export const bookingIdSchema = z.object({
  id: z.coerce.number().int().min(1, 'Invalid booking ID'),
});

export type InitiateBookingInput = z.infer<typeof initiateBookingSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors)

- [ ] **Step 3: Commit**

```bash
git add lib/validators/booking.ts
git commit -m "feat(phase-2): add initiateBookingSchema validator"
```

---

## Task 5: API routes — initiate, get, cancel, list

**Files:**
- Create: `app/api/bookings/initiate/route.ts`
- Create: `app/api/bookings/[id]/route.ts`
- Create: `app/api/bookings/[id]/cancel/route.ts`
- Create: `app/api/student/bookings/route.ts`
- Create: `app/api/instructor/bookings/route.ts`

- [ ] **Step 1: Create POST /api/bookings/initiate**

Create `app/api/bookings/initiate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { BookingService } from '@/lib/services/bookingService';
import { initiateBookingSchema } from '@/lib/validators/booking';
import { ApiResponse, UserRole, IBooking, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<Record<string, string>> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const body = await req.json();
    const validated = initiateBookingSchema.parse(body);

    const booking = await BookingService.initiateBooking(
      context.user.userId,
      validated
    );

    return NextResponse.json<ApiResponse<IBooking>>(
      { success: true, message: 'Booking created — proceed to payment', data: booking },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Initiate booking error:`, error);
    return handleApiError(error, requestId);
  }
}

export const POST = withAuth([UserRole.STUDENT], handler);
```

- [ ] **Step 2: Create GET /api/bookings/[id]**

Create `app/api/bookings/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { BookingService } from '@/lib/services/bookingService';
import { bookingIdSchema } from '@/lib/validators/booking';
import { ApiResponse, IBooking, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { id } = await context.params;
    const { id: bookingId } = bookingIdSchema.parse({ id });

    const booking = await BookingService.getById(
      bookingId,
      context.user.userId,
      context.user.role
    );

    return NextResponse.json<ApiResponse<IBooking>>({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Get booking error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth('all', handler);
```

- [ ] **Step 3: Create PUT /api/bookings/[id]/cancel**

Create `app/api/bookings/[id]/cancel/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { BookingService } from '@/lib/services/bookingService';
import { bookingIdSchema } from '@/lib/validators/booking';
import { ApiResponse, UserRole, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const { id } = await context.params;
    const { id: bookingId } = bookingIdSchema.parse({ id });

    await BookingService.cancelBooking(bookingId, context.user.userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Booking cancelled',
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] Cancel booking error:`, error);
    return handleApiError(error, requestId);
  }
}

export const PUT = withAuth([UserRole.STUDENT], handler);
```

- [ ] **Step 4: Create GET /api/student/bookings**

Create `app/api/student/bookings/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { BookingService } from '@/lib/services/bookingService';
import { ApiResponse, UserRole, BookingWithDetails, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<Record<string, string>> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const url = new URL(req.url);
    const statusParam = url.searchParams.get('status') ?? undefined;

    // Map URL params to BookingStatus
    const statusMap: Record<string, string> = {
      upcoming: 'confirmed',
      pending: 'pending_payment',
    };
    const dbStatus = statusParam && statusParam !== 'all'
      ? (statusMap[statusParam] ?? statusParam) as any
      : undefined;

    const bookings = await BookingService.listForStudent(
      context.user.userId,
      dbStatus
    );

    return NextResponse.json<ApiResponse<{ bookings: BookingWithDetails[]; count: number }>>({
      success: true,
      data: { bookings, count: bookings.length },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] List student bookings error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth([UserRole.STUDENT], handler);
```

- [ ] **Step 5: Create GET /api/instructor/bookings**

Create `app/api/instructor/bookings/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { BookingService } from '@/lib/services/bookingService';
import { ApiResponse, UserRole, BookingWithDetails, JwtPayload } from '@/types';
import { handleApiError } from '@/lib/api/errors';

async function handler(
  req: NextRequest,
  context: { user: JwtPayload; params: Promise<Record<string, string>> }
) {
  const requestId = req.headers.get('x-request-id') ?? undefined;
  try {
    const bookings = await BookingService.listForInstructor(context.user.userId);

    return NextResponse.json<ApiResponse<{ bookings: BookingWithDetails[]; count: number }>>({
      success: true,
      data: { bookings, count: bookings.length },
    });
  } catch (error) {
    console.error(`[${requestId ?? 'no-id'}] List instructor bookings error:`, error);
    return handleApiError(error, requestId);
  }
}

export const GET = withAuth([UserRole.INSTRUCTOR, UserRole.ADMIN], handler);
```

- [ ] **Step 6: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/api/bookings/ app/api/student/bookings/ app/api/instructor/bookings/
git commit -m "feat(phase-2): add booking API routes (initiate, get, cancel, list)"
```

---

## Task 6: Fix booking hooks to work with ApiResponse envelope

**Files:**
- Modify: `features/bookings/api/use-bookings.ts`

The existing hooks call `apiClient.post<IBooking>(...)` but the API returns `ApiResponse<IBooking>`. They need to unwrap the envelope, matching the pattern in `use-time-slots.ts`.

- [ ] **Step 1: Update use-bookings.ts**

Replace the contents of `features/bookings/api/use-bookings.ts`:

```typescript
/**
 * Bookings Feature - API Hooks
 * React Query hooks for booking management
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type {
  IBooking,
  BookingWithDetails,
  InitiateBookingDTO,
  ApiResponse,
} from '@/lib/types';
import { useNotifications } from '@/lib/stores/notifications';

type BookingListPayload = { bookings: BookingWithDetails[]; count: number };

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined || response.data === null) {
    throw new Error(response.error || response.message || 'Request failed');
  }
  return response.data;
}

const BOOKINGS_QUERY_KEYS = {
  all: ['bookings'] as const,
  student: ['bookings', 'student'] as const,
  instructor: ['bookings', 'instructor'] as const,
  admin: ['bookings', 'admin'] as const,
  detail: (id: number) => ['bookings', id] as const,
};

export { BOOKINGS_QUERY_KEYS };

/**
 * Student's own bookings.
 */
export function useMyBookings(status?: 'upcoming' | 'past' | 'all') {
  return useQuery({
    queryKey: [...BOOKINGS_QUERY_KEYS.student, status || 'all'],
    queryFn: async () => {
      const params = status && status !== 'all' ? `?status=${status}` : '';
      const response = await apiClient.get<ApiResponse<BookingListPayload>>(
        `/api/student/bookings${params}`
      );
      return unwrap(response).bookings;
    },
  });
}

/**
 * Instructor's bookings across all their courses.
 */
export function useInstructorBookings() {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEYS.instructor,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<BookingListPayload>>(
        '/api/instructor/bookings'
      );
      return unwrap(response).bookings;
    },
  });
}

/**
 * Admin bookings list with filters.
 */
export function useAdminBookings(filters?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  return useQuery({
    queryKey: [...BOOKINGS_QUERY_KEYS.admin, filters],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<BookingListPayload>>(
        `/api/admin/bookings?${queryParams.toString()}`
      );
      return unwrap(response).bookings;
    },
  });
}

/**
 * Fetch a single booking by ID.
 */
export function useBookingDetail(bookingId: number) {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEYS.detail(bookingId),
    enabled: Number.isFinite(bookingId) && bookingId > 0,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<IBooking>>(
        `/api/bookings/${bookingId}`
      );
      return unwrap(response);
    },
  });
}

/**
 * Initiate a new booking (hold a slot).
 */
export function useInitiateBooking() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<IBooking, Error, InitiateBookingDTO>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<IBooking>>(
        '/api/bookings/initiate',
        data
      );
      return unwrap(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.student });
      // Also invalidate available slots so the picker reflects the hold
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
      addNotification({
        type: 'success',
        title: 'Slot Reserved',
        message: 'Please complete your payment to confirm the booking',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Booking Failed',
        message: error instanceof Error ? error.message : 'Unable to book this slot',
      });
    },
  });
}

/**
 * Cancel a pending booking.
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<void, Error, number>({
    mutationFn: async (bookingId) => {
      const response = await apiClient.put<ApiResponse>(
        `/api/bookings/${bookingId}/cancel`,
        {}
      );
      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to cancel');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.student });
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.instructor });
      queryClient.invalidateQueries({ queryKey: ['time-slots'] });
      addNotification({
        type: 'success',
        title: 'Booking Cancelled',
        message: 'Your booking has been cancelled and the slot released',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Cancel Failed',
        message: error instanceof Error ? error.message : 'Unable to cancel booking',
      });
    },
  });
}

/**
 * Update booking status (instructor/admin only).
 */
export function useUpdateBookingStatus(bookingId: number) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation<void, Error, 'confirmed' | 'cancelled' | 'completed' | 'no_show'>({
    mutationFn: async (status) => {
      const response = await apiClient.put<ApiResponse>(
        `/api/bookings/${bookingId}/status`,
        { status }
      );
      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to update');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.instructor });
      queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEYS.admin });
      addNotification({
        type: 'success',
        title: 'Booking Updated',
        message: 'Status has been updated',
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Unable to update booking',
      });
    },
  });
}
```

Key changes:
- Added `unwrap()` helper matching `use-time-slots.ts` pattern
- All query hooks unwrap the `ApiResponse` envelope
- `useInitiateBooking` returns typed `IBooking` and invalidates `time-slots` cache
- `useCancelBooking` takes `bookingId` at mutate time (not constructor) — more flexible
- Added `useBookingDetail` hook
- Exported `BOOKINGS_QUERY_KEYS` for cross-feature invalidation

- [ ] **Step 2: Update barrel export**

The barrel at `features/bookings/api/index.ts` already exports all hooks. Add `useBookingDetail` and `BOOKINGS_QUERY_KEYS`:

```typescript
export { useMyBookings, useInstructorBookings, useAdminBookings, useInitiateBooking, useCancelBooking, useUpdateBookingStatus, useBookingDetail, BOOKINGS_QUERY_KEYS } from './use-bookings';
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add features/bookings/api/
git commit -m "fix(phase-2): rewire booking hooks with ApiResponse unwrapping"
```

---

## Task 7: Student course detail — wire booking button

**Files:**
- Modify: `app/(dashboard)/student/courses/[id]/student-course-detail.tsx`

Replace the "Enroll" section with a "Book this slot" flow that calls `useInitiateBooking`.

- [ ] **Step 1: Update StudentCourseDetail**

Replace the contents of `app/(dashboard)/student/courses/[id]/student-course-detail.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { courseApi } from '@/lib/api';
import { SlotPicker } from '@/features/time-slots';
import { useAvailableSlots } from '@/features/time-slots/api';
import { useInitiateBooking } from '@/features/bookings/api';
import type { ITimeSlot, PaymentMethod } from '@/lib/types';

type StudentCourseDetailProps = {
  courseId: number;
};

type CourseData = {
  id: number;
  title: string;
  description: string | null;
  price: number;
  price_per_slot: number;
  currency: string;
  status: string;
  instructor?: { name: string; email: string };
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'paymob_card', label: 'Credit / Debit Card' },
  { value: 'paymob_wallet', label: 'Vodafone Cash' },
  { value: 'paymob_fawry', label: 'Fawry' },
  { value: 'instapay', label: 'InstaPay (manual transfer)' },
];

export function StudentCourseDetail({ courseId }: StudentCourseDetailProps) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paymob_card');

  const { data: courseRes, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['student-course', courseId],
    queryFn: async () => {
      const res = await courseApi.getCourseById(courseId);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Course not found');
      return res.data as { course?: CourseData } | CourseData;
    },
    enabled: courseId > 0,
  });

  const course: CourseData | undefined =
    courseRes && typeof courseRes === 'object' && 'course' in courseRes
      ? (courseRes as { course: CourseData }).course
      : (courseRes as CourseData);

  const { data: slots = [], isLoading: slotsLoading } = useAvailableSlots(courseId);
  const initiate = useInitiateBooking();

  const handleBook = () => {
    if (!selectedSlot) return;
    initiate.mutate(
      { slot_id: selectedSlot.id, payment_method: paymentMethod },
      {
        onSuccess: (booking) => {
          router.push(`/student/bookings`);
        },
      }
    );
  };

  if (courseLoading || courseError || !course) {
    return (
      <p className="text-red-600">
        {courseError instanceof Error ? courseError.message : 'Loading...'}
      </p>
    );
  }

  const price = Number(course.price_per_slot || course.price);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
        <p className="mt-2 text-gray-600">{course.description ?? 'No description'}</p>
        <div className="mt-3">
          <span className="text-lg font-semibold text-blue-600">
            {price} EGP / session
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Pick a time</h3>
        {slotsLoading ? (
          <p className="text-sm text-gray-500">Loading slots...</p>
        ) : (
          <SlotPicker
            courseId={courseId}
            slots={slots}
            onSelect={setSelectedSlot}
            selectedSlotId={selectedSlot?.id ?? null}
          />
        )}
      </div>

      {selectedSlot && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Payment method</h3>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((pm) => (
              <label key={pm.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value={pm.value}
                  checked={paymentMethod === pm.value}
                  onChange={() => setPaymentMethod(pm.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">{pm.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={handleBook}
              disabled={initiate.isPending}
              className="rounded bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {initiate.isPending ? 'Booking...' : `Book for ${price} EGP`}
            </button>
            {initiate.isError && (
              <p className="text-sm text-red-600">{initiate.error.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/student/courses/\[id\]/student-course-detail.tsx
git commit -m "feat(phase-2): wire booking button with payment method selector"
```

---

## Task 8: Student bookings page and nav link

**Files:**
- Create: `app/(dashboard)/student/bookings/page.tsx`
- Modify: `features/bookings/components/my-bookings.tsx`
- Modify: `features/bookings/components/index.ts`
- Modify: `app/(dashboard)/student/layout.tsx`

- [ ] **Step 1: Implement MyBookings component**

Replace `features/bookings/components/my-bookings.tsx`:

```typescript
'use client';

import { useMyBookings, useCancelBooking } from '@/features/bookings/api';
import type { BookingWithDetails } from '@/lib/types';

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-800',
  pending_review: 'bg-purple-100 text-purple-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-800',
  no_show: 'bg-red-100 text-red-800',
};

function BookingRow({ booking }: { booking: BookingWithDetails }) {
  const cancel = useCancelBooking();
  const canCancel = booking.status === 'pending_payment' || booking.status === 'pending_review';

  return (
    <li className="rounded border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{booking.course_title}</p>
          <p className="text-sm text-gray-500">
            {formatDate(booking.slot_start_time)} &ndash; {formatDate(booking.slot_end_time)}
          </p>
          <p className="text-sm text-gray-500">
            Instructor: {booking.instructor_name}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {Number(booking.amount)} EGP &middot; {booking.payment_method ?? 'not set'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[booking.status] ?? 'bg-gray-100'}`}>
            {booking.status.replace('_', ' ')}
          </span>
          {canCancel && (
            <button
              type="button"
              onClick={() => cancel.mutate(booking.id)}
              disabled={cancel.isPending}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              {cancel.isPending ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function MyBookings() {
  const { data: bookings = [], isLoading, error } = useMyBookings();

  if (isLoading) return <p className="text-sm text-gray-500">Loading bookings...</p>;
  if (error) return <p className="text-sm text-red-600">Failed to load bookings</p>;

  if (bookings.length === 0) {
    return (
      <div className="rounded border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-500">No bookings yet. Browse courses to book a session.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {bookings.map((b) => (
        <BookingRow key={b.id} booking={b as BookingWithDetails} />
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Update booking components barrel**

Replace `features/bookings/components/index.ts`:

```typescript
export { default as MyBookings } from './my-bookings';
export { default as BookingCart } from './booking-cart';
```

- [ ] **Step 3: Create student bookings page**

Create `app/(dashboard)/student/bookings/page.tsx`:

```typescript
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
```

- [ ] **Step 4: Add nav link to student layout**

In `app/(dashboard)/student/layout.tsx`, add a "My Bookings" link after "My Courses":

```typescript
                <Link href="/student/my-courses" className="hover:text-gray-900">
                  My Courses
                </Link>
                <Link href="/student/bookings" className="hover:text-gray-900">
                  My Bookings
                </Link>
```

- [ ] **Step 5: Run typecheck and lint**

Run: `npx tsc --noEmit && yarn lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add features/bookings/components/ app/\(dashboard\)/student/bookings/ app/\(dashboard\)/student/layout.tsx
git commit -m "feat(phase-2): add student bookings page with cancel support"
```

---

## Task 9: End-to-end verification via curl

**Files:** None (manual testing)

- [ ] **Step 1: Start dev server**

Run: `yarn dev`

- [ ] **Step 2: Login as student and extract token**

```bash
curl -s -c /tmp/student.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"Test1234!"}' | python3 -m json.tool

STUDENT_TOKEN=$(grep auth_token /tmp/student.txt | awk '{print $NF}')
```

- [ ] **Step 3: Initiate a booking**

```bash
curl -s -X POST http://localhost:3000/api/bookings/initiate \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=$STUDENT_TOKEN" \
  -d '{"slot_id":1,"payment_method":"paymob_card"}' | python3 -m json.tool
```

Expected: 201 with booking data, `status: "pending_payment"`

- [ ] **Step 4: Verify slot is no longer available**

```bash
curl -s http://localhost:3000/api/courses/1/slots/available | python3 -m json.tool
```

Expected: The booked slot should NOT appear in the available list

- [ ] **Step 5: Test concurrent booking (same slot, should 409)**

```bash
curl -s -w "\nHTTP_STATUS: %{http_code}\n" -X POST http://localhost:3000/api/bookings/initiate \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=$STUDENT_TOKEN" \
  -d '{"slot_id":1,"payment_method":"paymob_card"}'
```

Expected: 409 with "no longer available" or "just booked"

- [ ] **Step 6: List student bookings**

```bash
curl -s http://localhost:3000/api/student/bookings \
  -H "Cookie: auth_token=$STUDENT_TOKEN" | python3 -m json.tool
```

Expected: Array containing the booking created in step 3

- [ ] **Step 7: Cancel the booking**

```bash
BOOKING_ID=<id from step 3>
curl -s -X PUT http://localhost:3000/api/bookings/$BOOKING_ID/cancel \
  -H "Cookie: auth_token=$STUDENT_TOKEN" | python3 -m json.tool
```

Expected: 200, "Booking cancelled"

- [ ] **Step 8: Verify slot is available again**

```bash
curl -s http://localhost:3000/api/courses/1/slots/available | python3 -m json.tool
```

Expected: The cancelled slot appears in available list again

- [ ] **Step 9: Commit verification notes (optional)**

No code changes needed.

---

## Task 10: UI verification via browser

- [ ] **Step 1: Login as student in browser**

Navigate to `http://localhost:3000/login`, login with student credentials.

- [ ] **Step 2: Book a slot**

Navigate to a published course page (`/student/courses/1`). Select a time slot, choose a payment method, click "Book".

Verify: Success notification appears, redirected to `/student/bookings`.

- [ ] **Step 3: Check My Bookings page**

Navigate to `/student/bookings`. Verify the booking appears with correct status, course title, and time.

- [ ] **Step 4: Cancel the booking**

Click "Cancel" on the pending booking. Verify it updates to "cancelled" status.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(phase-2): booking hold — complete with initiate, cancel, list, UI"
```

---

## Verification Summary

| Test | Expected | How to verify |
|------|----------|---------------|
| Initiate booking | 201, slot held | `POST /api/bookings/initiate` |
| Double-book same slot | 409 | Second `POST` with same `slot_id` |
| Cancel pending booking | 200, slot released | `PUT /api/bookings/:id/cancel` |
| Cancel confirmed booking | 400 rejected | Same endpoint on confirmed booking |
| Student can't cancel others' bookings | 403 | Different user tries cancel |
| Available slots excludes held | Slot missing from list | `GET /api/courses/:id/slots/available` |
| Student bookings list | Returns own bookings | `GET /api/student/bookings` |
| UI booking flow | Slot select → payment → redirect | Browser walkthrough |
| InstaPay sets pending_review | Different initial status | `POST` with `payment_method: "instapay"` |
