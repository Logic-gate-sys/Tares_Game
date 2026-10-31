// tests/globalSetup.ts
import { pool} from '../../src/config/database.ts';
import { migrateDatabase } from '../../src/db/migrate.ts'

// setup database with some schema to start with
export async function setup() {
  await pool.query(`
        DROP SCHEMA IF EXISTS public CASCADE;
        CREATE SCHEMA public;
        DROP SCHEMA IF EXISTS drizzle CASCADE;
      `);
  await migrateDatabase();
}

// Tear down 
export async function teardown() {
  await pool.query('TRUNCATE TABLE player_stats, seasons, users RESTART IDENTITY CASCADE');
  await pool.end();
}
