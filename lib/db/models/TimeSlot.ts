import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '@/lib/db/connection';
import type { ITimeSlot, CreateTimeSlotDTO, UpdateTimeSlotDTO } from '@/types';

/**
 * TimeSlot data access.
 *
 * All write methods accept an optional `PoolConnection` so they can participate
 * in a transaction opened by the booking service. When no connection is
 * provided, the default pool is used.
 */

type RunnerLike = Pick<PoolConnection, 'query'> | typeof pool;

function runner(conn?: PoolConnection): RunnerLike {
  return conn ?? pool;
}

export class TimeSlot {
  static async findById(id: number, conn?: PoolConnection): Promise<ITimeSlot | null> {
    const [rows] = await runner(conn).query<RowDataPacket[]>(
      'SELECT * FROM time_slots WHERE id = ?',
      [id]
    );
    return (rows[0] as ITimeSlot | undefined) ?? null;
  }

  /**
   * All time slots for a course, regardless of availability. Used by the
   * instructor-facing management view.
   */
  static async findByCourse(courseId: number): Promise<ITimeSlot[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM time_slots WHERE course_id = ? ORDER BY start_time ASC',
      [courseId]
    );
    return rows as ITimeSlot[];
  }

  /**
   * Slots that are still available AND start in the future. Used by the
   * public student-facing slot picker.
   */
  static async findAvailableByCourse(courseId: number): Promise<ITimeSlot[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM time_slots
       WHERE course_id = ?
         AND is_available = 1
         AND start_time > NOW()
       ORDER BY start_time ASC`,
      [courseId]
    );
    return rows as ITimeSlot[];
  }

  /**
   * Find slots for a course that overlap with a given time range. Used by
   * the time-slot service to reject overlapping creations.
   */
  static async findOverlapping(
    courseId: number,
    startTime: Date,
    endTime: Date,
    conn?: PoolConnection
  ): Promise<ITimeSlot[]> {
    const [rows] = await runner(conn).query<RowDataPacket[]>(
      `SELECT * FROM time_slots
       WHERE course_id = ?
         AND start_time < ?
         AND end_time > ?`,
      [courseId, endTime, startTime]
    );
    return rows as ITimeSlot[];
  }

  /**
   * Lock a slot row for update and return its current state. Used by
   * bookingService.initiateBooking to prevent the read-check-insert race.
   * MUST be called inside a transaction (pass `conn`) or this has no effect.
   */
  static async lockForBooking(conn: PoolConnection, id: number): Promise<ITimeSlot | null> {
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM time_slots WHERE id = ? FOR UPDATE',
      [id]
    );
    return (rows[0] as ITimeSlot | undefined) ?? null;
  }

  static async create(data: CreateTimeSlotDTO, conn?: PoolConnection): Promise<ITimeSlot> {
    const [result] = await runner(conn).query<ResultSetHeader>(
      'INSERT INTO time_slots (course_id, start_time, end_time) VALUES (?, ?, ?)',
      [data.course_id, new Date(data.start_time), new Date(data.end_time)]
    );
    const created = await TimeSlot.findById(result.insertId, conn);
    if (!created) {
      throw new Error('Failed to load newly-created time slot');
    }
    return created;
  }

  static async update(
    id: number,
    data: UpdateTimeSlotDTO,
    conn?: PoolConnection
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: Array<Date | number> = [];

    if (data.start_time !== undefined) {
      fields.push('start_time = ?');
      values.push(new Date(data.start_time));
    }
    if (data.end_time !== undefined) {
      fields.push('end_time = ?');
      values.push(new Date(data.end_time));
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await runner(conn).query<ResultSetHeader>(
      `UPDATE time_slots SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  /**
   * Mark the slot as held by a specific user. Used during booking initiation
   * inside the same transaction as the booking insert.
   */
  static async markHeld(
    conn: PoolConnection,
    slotId: number,
    userId: number
  ): Promise<boolean> {
    const [result] = await conn.query<ResultSetHeader>(
      'UPDATE time_slots SET is_available = 0, booked_by = ? WHERE id = ? AND is_available = 1',
      [userId, slotId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Release the slot (return it to the pool). Called on booking cancellation
   * or hold expiry.
   */
  static async release(conn: PoolConnection, slotId: number): Promise<boolean> {
    const [result] = await conn.query<ResultSetHeader>(
      'UPDATE time_slots SET is_available = 1, booked_by = NULL WHERE id = ?',
      [slotId]
    );
    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM time_slots WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

export default TimeSlot;
