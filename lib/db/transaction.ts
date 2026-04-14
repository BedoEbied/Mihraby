import type { PoolConnection } from 'mysql2/promise';
import pool from '@/lib/db/connection';

/**
 * Run `fn` inside a database transaction. On success, commit. On any thrown
 * error, rollback and re-throw.
 *
 * Models that participate in transactions should accept an optional
 * `PoolConnection` parameter and use it in place of the default pool when
 * provided — otherwise nested calls will silently run on separate connections
 * and the transaction's isolation will be lost.
 *
 * @example
 *   const booking = await withTransaction(async (conn) => {
 *     const slot = await TimeSlot.lockForBooking(conn, slotId);
 *     if (!slot.is_available) throw new Error('Slot taken');
 *     return Booking.create(conn, {...});
 *   });
 */
export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    try {
      await conn.rollback();
    } catch (rollbackError) {
      // Rollback failure should not mask the original error, but log it.
      console.error('Rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * MySQL duplicate-entry error code. Thrown by INSERT / UPDATE when a unique
 * constraint is violated. The booking service uses this to detect concurrent
 * slot bookings (two students racing for the same slot) via the UNIQUE index
 * on the `bookings.slot_hold` generated column.
 */
export const MYSQL_DUP_ENTRY_ERRNO = 1062;

/**
 * Narrow test for duplicate-entry errors thrown by mysql2.
 */
export function isDuplicateEntryError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errno' in error &&
    (error as { errno?: number }).errno === MYSQL_DUP_ENTRY_ERRNO
  );
}
