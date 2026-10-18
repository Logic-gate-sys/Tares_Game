import {  afterEach } from 'vitest';
import { pool } from '../../src/config/database.ts';


afterEach(async () => {
  await pool.query('DELETE FROM users'); 
})
