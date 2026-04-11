import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from '@/lib/db/connection';
import type {
  IBooking,
  BookingWithDetails,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  BookingMeetingPlatform
} from '@/types';

/**
 * Booking data access. See `lib/services/bookingService.ts` for the business
 * logic that glues the models, payment gateway, and meeting provider together.
 *
 * All write paths accept an optional PoolConnection so they can participate in
 * transactions opened by the booking service.
 */

type RunnerLike = Pick<PoolConnection, 'query'> | typeof pool;

function runner(conn?: PoolConnection): RunnerLike {
  return conn ?? pool;
}

export interface CreateBookingRow {
  user_id: number;
  course_id: number;
  slot_id: number;
  amount: number;
  payment_method: PaymentMethod | null;
  status: BookingStatus;
}

export interface UpdateBookingStatusPatch {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod | null;
  payment_id?: string | null;
  transaction_id?: string | null;
  meeting_link?: string | null;
  meeting_id?: string | null;
  meeting_platform?: BookingMeetingPlatform;
  cancelled_at?: Date | null;
  instapay_reference?: string | null;
  payment_proof_path?: string | null;
  payment_proof_uploaded_at?: Date | null;
  admin_notes?: string | null;
}

export class Booking {
  static async findById(id: number, conn?: PoolConnection): Promise<IBooking | null> {
    const [rows] = await runner(conn).query<RowDataPacket[]>(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );
    return (rows[0] as IBooking | undefined) ?? null;
  }

  /**
   * Lock a booking row for update and return it. Used by the Paymob webhook
   * and InstaPay admin-approval flows to guarantee idempotent status
   * transitions.
   */
  static async lockById(conn: PoolConnection, id: number): Promise<IBooking | null> {
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
      [id]
    );
    return (rows[0] as IBooking | undefined) ?? null;
  }

  static async findByUser(userId: number, status?: BookingStatus): Promise<BookingWithDetails[]> {
    const whereClauses = ['b.user_id = ?'];
    const params: Array<string | number> = [userId];
    if (status) {
      whereClauses.push('b.status = ?');
      params.push(status);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      Booking.bookingWithDetailsQuery(whereClauses.join(' AND ')),
      params
    );
    return rows as BookingWithDetails[];
  }

  static async findByInstructor(instructorId: number): Promise<BookingWithDetails[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      Booking.bookingWithDetailsQuery('c.instructor_id = ?'),
      [instructorId]
    );
    return rows as BookingWithDetails[];
  }

  static async findForAdmin(filters: {
    status?: BookingStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<BookingWithDetails[]> {
    const whereClauses: string[] = ['1 = 1'];
    const params: Array<string | number> = [];

    if (filters.status) {
      whereClauses.push('b.status = ?');
      params.push(filters.status);
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(
      `${Booking.bookingWithDetailsQuery(whereClauses.join(' AND '))} LIMIT ? OFFSET ?`,
      params
    );
    return rows as BookingWithDetails[];
  }

  /**
   * Stale pending-payment holds — used by the expiry cron.
   */
  static async findPendingOlderThan(cutoff: Date, conn?: PoolConnection): Promise<IBooking[]> {
    const [rows] = await runner(conn).query<RowDataPacket[]>(
      `SELECT * FROM bookings
       WHERE status = 'pending_payment'
         AND booked_at < ?`,
      [cutoff]
    );
    return rows as IBooking[];
  }

  static async create(conn: PoolConnection, data: CreateBookingRow): Promise<IBooking> {
    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO bookings
        (user_id, course_id, slot_id, amount, payment_method, payment_status, status)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [data.user_id, data.course_id, data.slot_id, data.amount, data.payment_method, data.status]
    );
    const created = await Booking.findById(result.insertId, conn);
    if (!created) {
      throw new Error('Failed to load newly-created booking');
    }
    return created;
  }

  static async updateFields(
    conn: PoolConnection,
    id: number,
    patch: UpdateBookingStatusPatch
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: Array<string | number | Date | null> = [];

    const apply = <K extends keyof UpdateBookingStatusPatch>(column: string, key: K) => {
      if (patch[key] !== undefined) {
        fields.push(`${column} = ?`);
        values.push(patch[key] as string | number | Date | null);
      }
    };

    apply('status', 'status');
    apply('payment_status', 'payment_status');
    apply('payment_method', 'payment_method');
    apply('payment_id', 'payment_id');
    apply('transaction_id', 'transaction_id');
    apply('meeting_link', 'meeting_link');
    apply('meeting_id', 'meeting_id');
    apply('meeting_platform', 'meeting_platform');
    apply('cancelled_at', 'cancelled_at');
    apply('instapay_reference', 'instapay_reference');
    apply('payment_proof_path', 'payment_proof_path');
    apply('payment_proof_uploaded_at', 'payment_proof_uploaded_at');
    apply('admin_notes', 'admin_notes');

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await conn.query<ResultSetHeader>(
      `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  private static bookingWithDetailsQuery(whereClause: string): string {
    return `
      SELECT
        b.*,
        c.title AS course_title,
        c.instructor_id AS instructor_id,
        iu.name AS instructor_name,
        ts.start_time AS slot_start_time,
        ts.end_time AS slot_end_time,
        su.name AS student_name,
        su.email AS student_email
      FROM bookings b
      JOIN courses c ON b.course_id = c.id
      JOIN users iu ON c.instructor_id = iu.id
      JOIN time_slots ts ON b.slot_id = ts.id
      JOIN users su ON b.user_id = su.id
      WHERE ${whereClause}
      ORDER BY b.booked_at DESC
    `;
  }
}

export default Booking;
