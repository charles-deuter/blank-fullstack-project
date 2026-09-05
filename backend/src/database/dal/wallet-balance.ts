import { asc, eq } from 'drizzle-orm';
import { db } from '../db';
import { walletBalances } from '../models/wallet-balance';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

type Tx = NodePgDatabase<any>;

export async function findAll() {
  return db.select().from(walletBalances).orderBy(asc(walletBalances.currency));
}

export async function findByCurrencyForUpdate(currency: string, trx: Tx) {
  const rows = await trx
    .select()
    .from(walletBalances)
    .where(eq(walletBalances.currency, currency))
    .for('update');
  return rows[0] ?? null;
}

export async function updateAmount(id: number, newAmount: number, trx: Tx) {
  return trx
    .update(walletBalances)
    .set({ amount: newAmount })
    .where(eq(walletBalances.id, id));
}
