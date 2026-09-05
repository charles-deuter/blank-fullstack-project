import { desc } from 'drizzle-orm';
import { db } from '../db';
import { exchanges, ExchangeInsertType } from '../models/exchange';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

type Tx = NodePgDatabase<any>;

export async function create(record: ExchangeInsertType, trx: Tx) {
  const [created] = await trx.insert(exchanges).values(record).returning();
  return created;
}

export async function findAll() {
  return db
    .select()
    .from(exchanges)
    .orderBy(desc(exchanges.created_at), desc(exchanges.id));
}
