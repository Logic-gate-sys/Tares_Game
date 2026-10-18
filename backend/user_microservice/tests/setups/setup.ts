import {  afterEach } from 'vitest';
import { pool } from '../../src/config/database.ts';

// Clean slit for  a new user test starts with removing all data and making db clean
afterEach(async () => {
  await pool.query('DELETE FROM users'); 
})
