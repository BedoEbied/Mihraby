import { TimeSlot } from '@/lib/db/models/TimeSlot';
import { Course } from '@/lib/db/models/Course';
import { withTransaction } from '@/lib/db/transaction';
import { ApiError, ApiErrorCode } from '@/lib/api/errors';
import { minutesBetween } from '@/lib/time';
import type {
  ITimeSlot,
  CreateTimeSlotDTO,
  CreateTimeSlotsBulkDTO,
  UpdateTimeSlotDTO,
  UserRole,
} from '@/types';
import { UserRole as Roles } from '@/types';

/**
 * Time Slot Service
 *
 * Owns time-slot lifecycle for instructor-managed courses. Enforces that:
 *   - the caller owns the course (or is an admin)
 *   - slot durations match `course.slot_duration`
 *   - slots are in the future
 *   - slots do not overlap an existing slot on the same course
 *
 * Overlap detection and insertion share a transaction so concurrent
 * creates on the same course cannot both slip past the check.
 *
 * Held slots (those referenced by a non-cancelled booking) cannot be
 * mutated or deleted; the instructor must cancel the booking first.
 */
export class TimeSlotService {
  private static async loadCourseAndAuthorize(
    courseId: number,
    userId: number,
    userRole: UserRole
  ) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError('Course not found', 404, ApiErrorCode.NOT_FOUND);
    }
    if (course.instructor_id !== userId && userRole !== Roles.ADMIN) {
      throw new ApiError(
        'Not authorized to manage slots for this course',
        403,
        ApiErrorCode.FORBIDDEN
      );
    }
    return course;
  }

  private static assertFuture(startTime: string): void {
    if (new Date(startTime).getTime() <= Date.now()) {
      throw new ApiError(
        'Slots must start in the future',
        400,
        ApiErrorCode.VALIDATION_ERROR
      );
    }
  }

  private static assertDurationMatches(
    startTime: string,
    endTime: string,
    expectedMinutes: number
  ): void {
    const actual = minutesBetween(new Date(startTime), new Date(endTime));
    if (actual !== expectedMinutes) {
      throw new ApiError(
        `Slot duration must be ${expectedMinutes} minutes (got ${actual})`,
        400,
        ApiErrorCode.VALIDATION_ERROR
      );
    }
  }

  /**
   * Create a single time slot on a course. Wrapped in a transaction so
   * the overlap check and insert happen atomically.
   */
  static async createSlot(
    userId: number,
    userRole: UserRole,
    data: CreateTimeSlotDTO
  ): Promise<ITimeSlot> {
    const course = await this.loadCourseAndAuthorize(data.course_id, userId, userRole);
    this.assertFuture(data.start_time);
    this.assertDurationMatches(data.start_time, data.end_time, course.slot_duration);

    return withTransaction(async (conn) => {
      const overlapping = await TimeSlot.findOverlapping(
        data.course_id,
        new Date(data.start_time),
        new Date(data.end_time),
        conn
      );
      if (overlapping.length > 0) {
        throw new ApiError(
          'Slot overlaps an existing slot on this course',
          409,
          ApiErrorCode.VALIDATION_ERROR
        );
      }
      return TimeSlot.create(data, conn);
    });
  }

  /**
   * Bulk slot creation. Validates each slot individually, then inserts
   * all of them in a single transaction. Any overlap (existing OR
   * within the batch) aborts the entire batch.
   */
  static async createSlotsBulk(
    userId: number,
    userRole: UserRole,
    data: CreateTimeSlotsBulkDTO
  ): Promise<ITimeSlot[]> {
    const course = await this.loadCourseAndAuthorize(data.course_id, userId, userRole);

    for (const slot of data.slots) {
      this.assertFuture(slot.start_time);
      this.assertDurationMatches(slot.start_time, slot.end_time, course.slot_duration);
    }

    // Reject in-batch overlaps before we even hit the DB.
    const sorted = [...data.slots].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    for (let i = 1; i < sorted.length; i++) {
      if (
        new Date(sorted[i].start_time).getTime() <
        new Date(sorted[i - 1].end_time).getTime()
      ) {
        throw new ApiError(
          'Slots in the batch overlap each other',
          400,
          ApiErrorCode.VALIDATION_ERROR
        );
      }
    }

    return withTransaction(async (conn) => {
      const created: ITimeSlot[] = [];
      for (const slot of data.slots) {
        const overlapping = await TimeSlot.findOverlapping(
          data.course_id,
          new Date(slot.start_time),
          new Date(slot.end_time),
          conn
        );
        if (overlapping.length > 0) {
          throw new ApiError(
            'A slot in the batch overlaps an existing slot on this course',
            409,
            ApiErrorCode.VALIDATION_ERROR
          );
        }
        const row = await TimeSlot.create(
          { course_id: data.course_id, start_time: slot.start_time, end_time: slot.end_time },
          conn
        );
        created.push(row);
      }
      return created;
    });
  }

  static async listByCourse(
    userId: number,
    userRole: UserRole,
    courseId: number
  ): Promise<ITimeSlot[]> {
    await this.loadCourseAndAuthorize(courseId, userId, userRole);
    return TimeSlot.findByCourse(courseId);
  }

  /**
   * Public read used by the student slot picker — no auth required by
   * the caller. Already filters to available + future slots.
   */
  static async listAvailableByCourse(courseId: number): Promise<ITimeSlot[]> {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError('Course not found', 404, ApiErrorCode.NOT_FOUND);
    }
    return TimeSlot.findAvailableByCourse(courseId);
  }

  static async updateSlot(
    userId: number,
    userRole: UserRole,
    slotId: number,
    data: UpdateTimeSlotDTO
  ): Promise<ITimeSlot> {
    const existing = await TimeSlot.findById(slotId);
    if (!existing) {
      throw new ApiError('Time slot not found', 404, ApiErrorCode.NOT_FOUND);
    }
    const course = await this.loadCourseAndAuthorize(existing.course_id, userId, userRole);

    if (!existing.is_available) {
      throw new ApiError(
        'Cannot modify a slot that is already held or booked',
        409,
        ApiErrorCode.FORBIDDEN
      );
    }

    const nextStart = data.start_time ?? existing.start_time.toISOString();
    const nextEnd = data.end_time ?? existing.end_time.toISOString();
    this.assertFuture(nextStart);
    this.assertDurationMatches(nextStart, nextEnd, course.slot_duration);

    return withTransaction(async (conn) => {
      const overlapping = await TimeSlot.findOverlapping(
        existing.course_id,
        new Date(nextStart),
        new Date(nextEnd),
        conn
      );
      const conflict = overlapping.find((s) => s.id !== slotId);
      if (conflict) {
        throw new ApiError(
          'Slot overlaps an existing slot on this course',
          409,
          ApiErrorCode.VALIDATION_ERROR
        );
      }
      await TimeSlot.update(slotId, data, conn);
      const updated = await TimeSlot.findById(slotId, conn);
      if (!updated) {
        throw new ApiError('Failed to load updated slot', 500);
      }
      return updated;
    });
  }

  static async deleteSlot(
    userId: number,
    userRole: UserRole,
    slotId: number
  ): Promise<void> {
    const existing = await TimeSlot.findById(slotId);
    if (!existing) {
      throw new ApiError('Time slot not found', 404, ApiErrorCode.NOT_FOUND);
    }
    await this.loadCourseAndAuthorize(existing.course_id, userId, userRole);

    if (!existing.is_available) {
      throw new ApiError(
        'Cannot delete a slot that is already held or booked — cancel the booking first',
        409,
        ApiErrorCode.FORBIDDEN
      );
    }

    const deleted = await TimeSlot.delete(slotId);
    if (!deleted) {
      throw new ApiError('Failed to delete slot', 500);
    }
  }
}

export default TimeSlotService;
