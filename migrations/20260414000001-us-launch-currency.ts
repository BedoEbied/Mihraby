import { Knex } from 'knex';

/**
 * US launch: switch default currency from EGP to USD and backfill existing rows.
 * Part of the US Go-Live PayPal pivot (see plans/fancy-twirling-harp.md).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('courses', (table) => {
    table.string('currency', 3).defaultTo('USD').alter();
  });

  await knex('courses').where({ currency: 'EGP' }).update({ currency: 'USD' });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('courses', (table) => {
    table.string('currency', 3).defaultTo('EGP').alter();
  });

  await knex('courses').where({ currency: 'USD' }).update({ currency: 'EGP' });
}
