import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import 'dotenv/config';

const host = process.env.DATABASE_HOST;
const port = process.env.DATABASE_PORT;
const database = process.env.DATABASE_NAME;
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;

export const pool = new Pool({
  connectionString: `postgres://${user}:${password}@${host}:${port}/${database}`,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });

// A DAL function may run either on the pooled connection or inside an open
// transaction. Routes that own a transaction boundary pass the `tx` handle through;
// everything else gets `db` by default. See docs/adr/0001.
export type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
