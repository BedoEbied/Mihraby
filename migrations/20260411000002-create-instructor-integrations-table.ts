import { Knex } from 'knex';

/**
 * Phase 0: Table for instructor third-party integrations (Zoom OAuth in MVP,
 * extensible to Google Meet / Microsoft Teams later).
 *
 * Tokens are stored encrypted (AES-256-GCM, see lib/crypto.ts). The columns
 * are VARCHAR to hold the base64url-encoded output of lib/crypto.ts#encrypt.
 * Never write plaintext tokens to this table.
 *
 * Each (instructor_id, provider) pair is unique — one instructor has at most
 * one Zoom connection. Re-connecting upserts the existing row.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('instructor_integrations', (table) => {
    table.increments('id').primary();
    table
      .integer('instructor_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.enum('provider', ['zoom']).notNullable();
    // Encrypted at rest. See lib/crypto.ts.
    table.text('access_token').notNullable();
    table.text('refresh_token').notNullable();
    table.timestamp('expires_at').notNullable();
    table.string('provider_user_id', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['instructor_id', 'provider']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('instructor_integrations');
}
