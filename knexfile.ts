import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

// DB_CLIENT is parameterized so the later Postgres swap (Hetzner+Coolify
// migration) is a single env var change plus the targeted schema/errno PR.
// Default stays 'mysql2' — zero behavior change at launch.
const baseConfig: Knex.Config = {
  client: process.env.DB_CLIENT || 'mysql2',
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

export default config;
