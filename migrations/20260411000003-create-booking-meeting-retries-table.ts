import { Knex } from 'knex';

/**
 * Phase 0: Retry queue for Zoom meeting creation.
 *
 * When a booking transitions to `confirmed` (either via Paymob webhook or
 * admin InstaPay approval), we create a Zoom meeting on the instructor's
 * behalf. This call happens AFTER the booking-status transaction commits,
 * so a failure here must not roll back the payment — money is already taken.
 *
 * Instead, failures insert a row here. A cron endpoint
 * (POST /api/cron/retry-meetings in Phase 6) processes pending rows with
 * exponential backoff, capped at a small number of attempts. Admin has a
 * manual "retry meeting" button for stuck bookings.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('booking_meeting_retries', (table) => {
    table.increments('id').primary();
    table
      .integer('booking_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('bookings')
      .onDelete('CASCADE');
    table.integer('attempts').notNullable().defaultTo(0);
    table.text('last_error').nullable();
    table.timestamp('next_retry_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // One open retry per booking. The cron marks rows complete by deleting them.
    table.unique(['booking_id']);
    table.index(['next_retry_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('booking_meeting_retries');
}
