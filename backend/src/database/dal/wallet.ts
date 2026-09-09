import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { exchangeTransaction } from '../models/exchangeTransaction';
import { wallet } from '../models/wallet';
import { walletBalance } from '../models/walletBalance';
import { convertMinorUnits, CurrencyCode, rateBetween } from '../../domain/currency';

export interface TransactionView {
  id: number;
  wallet_id: number;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  rate: number;
  created_at: Date;
}

export type ExchangeResult =
  | { ok: true; transaction: TransactionView }
  | { ok: false; reason: 'insufficient_balance'; available: number };

// numeric columns come back from pg as strings to preserve arbitrary precision;
// the API speaks in numbers.
function toView(row: typeof exchangeTransaction.$inferSelect): TransactionView {
  return { ...row, rate: Number(row.rate) };
}

export async function exists(walletId: number) {
  const [found] = await db
    .select({ id: wallet.id })
    .from(wallet)
    .where(eq(wallet.id, walletId));

  return found !== undefined;
}

export async function findBalances(walletId: number) {
  // id ordering matches the seed order, so the wallet always renders the same way.
  return db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.wallet_id, walletId))
    .orderBy(walletBalance.id);
}

export async function findTransactions(walletId: number) {
  const rows = await db
    .select()
    .from(exchangeTransaction)
    .where(eq(exchangeTransaction.wallet_id, walletId))
    .orderBy(desc(exchangeTransaction.created_at), desc(exchangeTransaction.id));

  return rows.map(toView);
}

export async function createExchange(
  walletId: number,
  from: CurrencyCode,
  to: CurrencyCode,
  fromAmount: number,
): Promise<ExchangeResult> {
  return db.transaction(async (tx) => {
    // Both rows are locked in a single id-ordered statement: two concurrent
    // exchanges in opposite directions would otherwise grab them in opposite
    // orders and deadlock.
    const rows = await tx
      .select()
      .from(walletBalance)
      .where(
        and(
          eq(walletBalance.wallet_id, walletId),
          inArray(walletBalance.currency, [from, to]),
        ),
      )
      .orderBy(walletBalance.id)
      .for('update');

    const source = rows.find((row) => row.currency === from)!;
    const target = rows.find((row) => row.currency === to)!;

    if (source.amount < fromAmount) {
      return { ok: false, reason: 'insufficient_balance', available: source.amount };
    }

    const toAmount = convertMinorUnits(fromAmount, from, to);

    await tx
      .update(walletBalance)
      .set({ amount: source.amount - fromAmount })
      .where(eq(walletBalance.id, source.id));

    await tx
      .update(walletBalance)
      .set({ amount: target.amount + toAmount })
      .where(eq(walletBalance.id, target.id));

    const [created] = await tx
      .insert(exchangeTransaction)
      .values({
        wallet_id: walletId,
        from_currency: from,
        to_currency: to,
        from_amount: fromAmount,
        to_amount: toAmount,
        rate: rateBetween(from, to).toString(),
      })
      .returning();

    return { ok: true, transaction: toView(created) };
  });
}
