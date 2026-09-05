import { eq } from 'drizzle-orm';
import { db } from '../db';
import { balances } from '../models/balance';
import { wallets } from '../models/wallet';

export async function findWallet(walletId: number) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));

  return wallet;
}

export async function findBalances(walletId: number) {
  return db.select().from(balances).where(eq(balances.wallet_id, walletId));
}
