import mysql from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export type SeededBooking = { id: number; amount: number; slotId: number };

export type BookingSnapshot = {
  status: string;
  payment_method: string | null;
  payment_id: string | null;
  transaction_id: string | null;
};

const SEED_COURSE_TITLE = 'Intro to Seed';

function dbConfig() {
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
}

/**
 * Directly insert a `pending_payment` booking + future-dated time slot for the
 * given student, bypassing the real slot-hold flow. This is acceptable for
 * E2E because `PayPalGateway` is independently unit-tested; the slot-hold
 * flow will get its own E2E in a later phase.
 */
export async function createPendingPaymentBooking(studentId: number): Promise<SeededBooking> {
  const conn = await mysql.createConnection(dbConfig());
  try {
    const [courseRows] = await conn.query<RowDataPacket[]>(
      'SELECT id FROM courses WHERE title = ? ORDER BY id ASC LIMIT 1',
      [SEED_COURSE_TITLE]
    );
    const course = courseRows[0];
    if (!course?.id) {
      throw new Error(
        `Seed course '${SEED_COURSE_TITLE}' not found — run \`yarn db:seed\` first.`
      );
    }
    const courseId = course.id as number;

    const [slotResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO time_slots (course_id, start_time, end_time, is_available)
       VALUES (?, UTC_TIMESTAMP() + INTERVAL 2 DAY, UTC_TIMESTAMP() + INTERVAL 2 DAY + INTERVAL 60 MINUTE, 1)`,
      [courseId]
    );
    const slotId = slotResult.insertId;

    const amount = 15.5;
    const [bookingResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO bookings (user_id, course_id, slot_id, amount, status)
       VALUES (?, ?, ?, ?, 'pending_payment')`,
      [studentId, courseId, slotId, amount]
    );
    return { id: bookingResult.insertId, amount, slotId };
  } finally {
    await conn.end();
  }
}

export async function deleteBooking(booking: SeededBooking): Promise<void> {
  const conn = await mysql.createConnection(dbConfig());
  try {
    await conn.query('DELETE FROM bookings WHERE id = ?', [booking.id]);
    await conn.query('DELETE FROM time_slots WHERE id = ?', [booking.slotId]);
  } finally {
    await conn.end();
  }
}

export async function fetchBookingSnapshot(bookingId: number): Promise<BookingSnapshot | null> {
  const conn = await mysql.createConnection(dbConfig());
  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT status, payment_method, payment_id, transaction_id FROM bookings WHERE id = ?',
      [bookingId]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      status: row.status as string,
      payment_method: (row.payment_method as string | null) ?? null,
      payment_id: (row.payment_id as string | null) ?? null,
      transaction_id: (row.transaction_id as string | null) ?? null,
    };
  } finally {
    await conn.end();
  }
}
