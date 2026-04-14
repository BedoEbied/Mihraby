import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('bookings', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('course_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('courses')
      .onDelete('CASCADE');
    table
      .integer('slot_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('time_slots')
      .onDelete('CASCADE');
    table
      .enum('payment_status', ['pending', 'paid', 'refunded', 'failed'])
      .defaultTo('pending');
    table.string('payment_method', 50).defaultTo('paymob');
    table.string('payment_id', 255).nullable();
    table.string('transaction_id', 255).nullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('meeting_link', 500).nullable();
    table.string('meeting_id', 255).nullable();
    table
      .enum('meeting_platform', ['zoom', 'google_meet', 'manual'])
      .defaultTo('manual');
    table
      .enum('status', ['confirmed', 'cancelled', 'completed', 'no_show'])
      .defaultTo('confirmed');
    table.timestamp('booked_at').defaultTo(knex.fn.now());
    table.timestamp('cancelled_at').nullable();

    // Indexes for performance
    table.index(['user_id', 'status']);
    table.index(['payment_status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('bookings');
}
