import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool() {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err.message);
  });

  return pool;
}
