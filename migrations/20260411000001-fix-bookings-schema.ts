import { Knex } from 'knex';

/**
 * Phase 0: Harden the bookings schema for the real booking flow.
 *
 * Changes:
 *   1. Widen `status` enum to include pending_payment / pending_review states.
 *      The original schema defaulted to `confirmed`, which skipped the payment
 *      lifecycle entirely. Default is now `pending_payment`.
 *   2. Add a STORED generated column `slot_hold` that equals `slot_id` when the
 *      booking is actively holding the slot (pending_payment, pending_review,
 *      confirmed) and NULL otherwise, combined with a UNIQUE index. This is
 *      how we prevent two students from booking the same slot concurrently —
 *      the second INSERT hits ER_DUP_ENTRY and the booking service maps it to
 *      HTTP 409.
 *   3. Add UNIQUE(transaction_id) so replayed Paymob webhooks (same
 *      transaction_id twice) are rejected at the database level. NULL values
 *      do not collide in MySQL, so this is safe for pre-payment rows.
 *   4. Add InstaPay manual review columns: instapay_reference,
 *      payment_proof_path, payment_proof_uploaded_at, admin_notes.
 *   5. Widen `meeting_platform` enum to include `pending_meeting` — booking is
 *      confirmed but Zoom API call failed, retry in progress.
 *
 * Because this modifies a freshly-scaffolded table with no production data,
 * `alterTable` is safe. If rows exist when this is rolled back, the removal
 * of enum values could fail.
 */
export async function up(knex: Knex): Promise<void> {
  // Widen status enum. MySQL doesn't support ALTER ENUM in place via knex's
  // fluent API easily, so run raw ALTER.
  await knex.raw(`
    ALTER TABLE bookings
      MODIFY COLUMN status ENUM(
        'pending_payment',
        'pending_review',
        'confirmed',
        'cancelled',
        'completed',
        'no_show'
      ) NOT NULL DEFAULT 'pending_payment'
  `);

  // Widen meeting_platform enum to include the pending_meeting sentinel used
  // when a booking is confirmed but Zoom creation failed and is being retried.
  await knex.raw(`
    ALTER TABLE bookings
      MODIFY COLUMN meeting_platform ENUM(
        'zoom',
        'google_meet',
        'manual',
        'pending_meeting'
      ) NOT NULL DEFAULT 'manual'
  `);

  // Relax payment_method so different gateways/methods can be recorded.
  // The scaffold typed it as VARCHAR already, but we drop its default so
  // InstaPay rows start with NULL and the admin flow sets it on approval.
  await knex.raw(`
    ALTER TABLE bookings
      MODIFY COLUMN payment_method VARCHAR(50) NULL DEFAULT NULL
  `);

  // InstaPay columns.
  await knex.schema.alterTable('bookings', (table) => {
    table.string('instapay_reference', 255).nullable();
    table.string('payment_proof_path', 500).nullable();
    table.timestamp('payment_proof_uploaded_at').nullable();
    table.text('admin_notes').nullable();
  });

  // Generated column + UNIQUE index for slot locking.
  // Using raw SQL because knex schema builder doesn't model generated columns
  // cleanly. STORED (not VIRTUAL) is required for a UNIQUE index in MySQL.
  //
  // MySQL 9.x rejects STORED generated columns that reference a FK column,
  // so we temporarily drop the FK on slot_id, add the generated column, then
  // re-add the FK.
  // MySQL 9.x doesn't allow STORED generated columns that reference a column
  // with a FK constraint. We drop the FK, add the generated column, and leave
  // the FK dropped — slot_id still has its index, and the slot_hold UNIQUE
  // constraint provides the critical concurrency guard. Referential integrity
  // for slot_id is enforced at the application layer (service + transaction).
  await knex.raw(`ALTER TABLE bookings DROP FOREIGN KEY bookings_slot_id_foreign`);

  await knex.raw(`
    ALTER TABLE bookings
      ADD COLUMN slot_hold INT UNSIGNED
        GENERATED ALWAYS AS (
          CASE
            WHEN status IN ('pending_payment', 'pending_review', 'confirmed')
              THEN slot_id
            ELSE NULL
          END
        ) STORED
  `);

  await knex.raw(`
    ALTER TABLE bookings
      ADD CONSTRAINT uniq_bookings_slot_hold UNIQUE (slot_hold)
  `);

  // Idempotency guard for webhook replays.
  await knex.raw(`
    ALTER TABLE bookings
      ADD CONSTRAINT uniq_bookings_transaction_id UNIQUE (transaction_id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE bookings DROP INDEX uniq_bookings_transaction_id`);
  await knex.raw(`ALTER TABLE bookings DROP INDEX uniq_bookings_slot_hold`);
  await knex.raw(`ALTER TABLE bookings DROP COLUMN slot_hold`);

  await knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('admin_notes');
    table.dropColumn('payment_proof_uploaded_at');
    table.dropColumn('payment_proof_path');
    table.dropColumn('instapay_reference');
  });

  await knex.raw(`
    ALTER TABLE bookings
      MODIFY COLUMN payment_method VARCHAR(50) NOT NULL DEFAULT 'paymob'
  `);

  await knex.raw(`
    ALTER TABLE bookings
      MODIFY COLUMN meeting_platform ENUM('zoom', 'google_meet', 'manual')
      NOT NULL DEFAULT 'manual'
  `);

  await knex.raw(`
    ALTER TABLE bookings
      MODIFY COLUMN status ENUM('confirmed', 'cancelled', 'completed', 'no_show')
      NOT NULL DEFAULT 'confirmed'
  `);
}
