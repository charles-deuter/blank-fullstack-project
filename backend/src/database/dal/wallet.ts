import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, Executor } from '../db';
import { wallets } from '../models/wallet';

export async function findAll(exec: Executor = db) {
  // id breaks ties: the ten seeded wallets share a created_at, so without this they
  // would come back in an undefined order that shuffles between queries.
  return exec.select().from(wallets).orderBy(desc(wallets.created_at), desc(wallets.id));
}

export async function findById(id: number, exec: Executor = db) {
  const [wallet] = await exec.select().from(wallets).where(eq(wallets.id, id));

  return wallet;
}

/**
 * Lock both sides of a transfer for the rest of the caller's transaction.
 *
 * ORDER BY id IS LOAD-BEARING, not cosmetic. Postgres applies row locks above the
 * sort, so ordering the query orders the locks. Without it, a concurrent A->B and
 * B->A pair grabs the two rows in opposite orders and deadlocks.
 *
 * Returns however many of the two ids actually exist, so the caller can tell which
 * side is missing.
 */
export async function lockPair(senderId: number, recipientId: number, tx: Executor) {
  return tx
    .select()
    .from(wallets)
    .where(inArray(wallets.id, [senderId, recipientId]))
    .orderBy(asc(wallets.id))
    .for('update');
}

/**
 * Debit a wallet, guarding the balance in the WHERE clause as well as in the
 * caller's check. Returns undefined if the row was not updated.
 */
export async function debit(id: number, amountCents: number, exec: Executor = db) {
  const [updated] = await exec
    .update(wallets)
    // A SQL delta, not a value read into JS and written back: that would clobber a
    // concurrent credit to the same wallet even with the row lock held.
    .set({ balance_cents: sql`${wallets.balance_cents} - ${amountCents}` })
    .where(and(eq(wallets.id, id), sql`${wallets.balance_cents} >= ${amountCents}`))
    .returning();

  return updated;
}

export async function credit(id: number, amountCents: number, exec: Executor = db) {
  const [updated] = await exec
    .update(wallets)
    .set({ balance_cents: sql`${wallets.balance_cents} + ${amountCents}` })
    .where(eq(wallets.id, id))
    .returning();

  return updated;
}
