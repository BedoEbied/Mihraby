import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('courses', (table) => {
    table.integer('slot_duration').defaultTo(60).comment('Duration in minutes');
    table.decimal('price_per_slot', 10, 2).notNullable().defaultTo(0.0);
    table
      .enum('meeting_platform', ['zoom', 'google_meet', 'manual'])
      .defaultTo('manual');
    table.string('meeting_link', 500).nullable();
    table.string('currency', 3).defaultTo('EGP');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('courses', (table) => {
    table.dropColumn('slot_duration');
    table.dropColumn('price_per_slot');
    table.dropColumn('meeting_platform');
    table.dropColumn('meeting_link');
    table.dropColumn('currency');
  });
}
