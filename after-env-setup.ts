import { pool } from './src/database/db';

afterAll(async () => {
  if (pool && !pool.ended) {
    await pool.end();
  }
});
