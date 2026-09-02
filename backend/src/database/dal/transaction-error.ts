import { desc } from 'drizzle-orm';
import { db, Executor } from '../db';
import { transactionErrors, TransferFailureReason } from '../models/transaction-error';

/**
 * Log a rejected transfer attempt.
 *
 * Callers MUST pass the plain `db` executor, never a `tx` handle: the rejection is
 * recorded after the transfer transaction has already rolled back, so the handle is
 * gone and an insert on it would be discarded with everything else. This write is
 * deliberately non-atomic and best-effort.
 */
export async function record(
  values: {
    sender_wallet_id: number | null;
    recipient_wallet_id: number | null;
    amount_cents: number | null;
    reason: TransferFailureReason;
  },
  exec: Executor = db,
) {
  const [created] = await exec.insert(transactionErrors).values(values).returning();

  return created;
}

// No route exposes the error log; this exists so specs can assert on what was
// recorded. Keeping it unserved avoids publishing which wallet ids exist.
export async function findAll(exec: Executor = db) {
  return exec
    .select()
    .from(transactionErrors)
    .orderBy(desc(transactionErrors.created_at), desc(transactionErrors.id));
}
