import { sql } from 'drizzle-orm';
import { db } from '../db';

export default async function heartbeat() {
  return await db.execute(sql`SELECT 1`);
}
