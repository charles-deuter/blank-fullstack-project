import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import { balances } from '../models/balance';
import { exchanges, ExchangeSelectType } from '../models/exchange';

export type ExchangeInput = {
  wallet_id: number;
  from_currency: string;
  to_currency: string;
  from_amount: bigint;
  to_amount: bigint;
  from_rate_usd: string;
  to_rate_usd: string;
};

export type ExchangeOutcome =
  { status: 'ok'; exchange: ExchangeSelectType } | { status: 'insufficient-funds' };

/**
 * Debit, credit and history insert as one transaction.
 *
 * The transaction alone is not enough: two concurrent exchanges could each read
 * the same balance and each spend it. Both balance rows are therefore locked
 * with SELECT ... FOR UPDATE *before* the funds check, and locked in currency
 * order so that opposing exchanges (EUR→JPY racing JPY→EUR) take the two rows
 * in the same order and cannot deadlock.
 */
export async function executeExchange(input: ExchangeInput): Promise<ExchangeOutcome> {
  return db.transaction(async (tx) => {
    const locked = await tx
      .select()
      .from(balances)
      .where(
        and(
          eq(balances.wallet_id, input.wallet_id),
          inArray(balances.currency, [input.from_currency, input.to_currency]),
        ),
      )
      .orderBy(asc(balances.currency))
      .for('update');

    const source = locked.find((row) => row.currency === input.from_currency);
    const target = locked.find((row) => row.currency === input.to_currency);

    if (!source || !target) {
      throw new Error(
        `wallet ${input.wallet_id} is missing a balance row for ${input.from_currency} or ${input.to_currency}`,
      );
    }

    // Checked after the lock, never before.
    if (source.amount < input.from_amount) {
      return { status: 'insufficient-funds' };
    }

    await tx
      .update(balances)
      .set({ amount: sql`${balances.amount} - ${input.from_amount}` })
      .where(eq(balances.id, source.id));

    await tx
      .update(balances)
      .set({ amount: sql`${balances.amount} + ${input.to_amount}` })
      .where(eq(balances.id, target.id));

    const [exchange] = await tx.insert(exchanges).values(input).returning();

    return { status: 'ok', exchange };
  });
}

export async function findExchanges(walletId: number) {
  // id breaks ties, matching dal/foo.ts: rows sharing a created_at would
  // otherwise come back in an order that can shuffle between queries.
  return db
    .select()
    .from(exchanges)
    .where(eq(exchanges.wallet_id, walletId))
    .orderBy(desc(exchanges.created_at), desc(exchanges.id));
}
