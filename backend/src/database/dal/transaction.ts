import { desc, eq, or } from 'drizzle-orm';
import { db, Executor } from '../db';
import { transactions } from '../models/transaction';

export async function create(
  values: {
    sender_wallet_id: number;
    recipient_wallet_id: number;
    amount_cents: number;
  },
  exec: Executor = db,
) {
  const [created] = await exec.insert(transactions).values(values).returning();

  return created;
}

export async function findAll(exec: Executor = db) {
  return exec
    .select()
    .from(transactions)
    .orderBy(desc(transactions.created_at), desc(transactions.id));
}

export async function findByWalletId(walletId: number, exec: Executor = db) {
  // A wallet's history is every transfer it touched, on either side.
  return exec
    .select()
    .from(transactions)
    .where(
      or(
        eq(transactions.sender_wallet_id, walletId),
        eq(transactions.recipient_wallet_id, walletId),
      ),
    )
    .orderBy(desc(transactions.created_at), desc(transactions.id));
}
