import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { transactions } from '../models/transaction';
import { walletBalances } from '../models/wallet';
import type { Currency } from '../../constants/currencies';

export async function findAllForWallet(walletId: number) {
  // id breaks ties: rows sharing a created_at would otherwise come back in an
  // undefined order that can shuffle between queries.
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.wallet_id, walletId))
    .orderBy(desc(transactions.created_at), desc(transactions.id));
}

export type CreateExchangeParams = {
  walletId: number;
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: number;
  toAmount: number;
  exchangeRate: string;
};

/**
 * Applies an exchange atomically. Returns null when the wallet lacks the funds.
 *
 * The debit is a conditional UPDATE rather than a read-then-write so two
 * concurrent exchanges cannot both pass a balance check and overdraw the wallet.
 */
export async function createExchange(params: CreateExchangeParams) {
  const { walletId, fromCurrency, toCurrency, fromAmount, toAmount, exchangeRate } =
    params;

  return db.transaction(async (tx) => {
    const debited = await tx
      .update(walletBalances)
      .set({ amount: sql`${walletBalances.amount} - ${fromAmount}` })
      .where(
        and(
          eq(walletBalances.wallet_id, walletId),
          eq(walletBalances.currency, fromCurrency),
          sql`${walletBalances.amount} >= ${fromAmount}`,
        ),
      )
      .returning();

    if (debited.length === 0) {
      return null;
    }

    await tx
      .update(walletBalances)
      .set({ amount: sql`${walletBalances.amount} + ${toAmount}` })
      .where(
        and(
          eq(walletBalances.wallet_id, walletId),
          eq(walletBalances.currency, toCurrency),
        ),
      );

    const [created] = await tx
      .insert(transactions)
      .values({
        wallet_id: walletId,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: fromAmount,
        to_amount: toAmount,
        exchange_rate: exchangeRate,
      })
      .returning();

    return created;
  });
}
