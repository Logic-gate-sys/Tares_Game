import { Pool } from 'pg';
import { env } from '../../src/env.ts';

export const pool = new Pool({ connectionString: env.DATABASE_URL });

// setup database with some schema to start with
export async function setup() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      p_level VARCHAR(50) NOT NULL DEFAULT '1',
      rank VARCHAR(50) NOT NULL DEFAULT 'unranked',
      bio TEXT NOT NULL,
      bg_class VARCHAR(250) NOT NULL,
      avatar_url TEXT NOT NULL,
      total_score INTEGER NOT NULL DEFAULT 0,
      wins DOUBLE PRECISION NOT NULL DEFAULT 0,
      accuracy INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_login TIMESTAMP NOT NULL DEFAULT NOW()) `
  );
}

// Tear down 
export async function teardown() {
  await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
  await pool.end();
}
