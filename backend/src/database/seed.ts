import { readFile } from 'node:fs/promises';
import { pool } from './db';

const SEED_FILE = new URL('../../seed.sql', import.meta.url);

async function main() {
  const sql = await readFile(SEED_FILE, 'utf8');

  await pool.query(sql);
  console.log('[seed] demo wallet ready');
  await pool.end();
}

main().catch(async (err) => {
  console.error('[seed] failed', err);
  await pool.end();
  process.exit(1);
});
