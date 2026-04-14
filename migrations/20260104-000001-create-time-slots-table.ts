import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('time_slots', (table) => {
    table.increments('id').primary();
    table
      .integer('course_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('courses')
      .onDelete('CASCADE');
    table.dateTime('start_time').notNullable();
    table.dateTime('end_time').notNullable();
    table.boolean('is_available').defaultTo(true);
    table
      .integer('booked_by')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes for performance
    table.index(['course_id', 'is_available']);
    table.index(['start_time']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('time_slots');
}
