import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { walletBalances, wallets } from '../models/wallet';
import type { Currency } from '../../constants/currencies';

export async function findById(walletId: number) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));

  return wallet ?? null;
}

export async function findBalances(walletId: number) {
  return db
    .select()
    .from(walletBalances)
    .where(eq(walletBalances.wallet_id, walletId))
    .orderBy(walletBalances.id);
}

export async function findBalance(walletId: number, currency: Currency) {
  const [balance] = await db
    .select()
    .from(walletBalances)
    .where(
      and(eq(walletBalances.wallet_id, walletId), eq(walletBalances.currency, currency)),
    );

  return balance ?? null;
}
