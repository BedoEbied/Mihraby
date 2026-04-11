import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const baseConfig: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mihraby_db',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
  },
  pool: {
    min: 0,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations',
    extension: 'ts'
  }
};

const config: { [key: string]: Knex.Config } = {
  development: baseConfig,
  production: baseConfig
};

// Export default for ESM-aware tooling while keeping CommonJS compatibility for Knex CLI require.
export default config;
module.exports = config;
