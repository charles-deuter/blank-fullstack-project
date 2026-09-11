import { db } from '../../src/database/db';
import { walletBalances, wallets } from '../../src/database/models/wallet';
import { CURRENCIES, type Currency } from '../../src/constants/currencies';

/**
 * Creates a wallet with explicit starting balances. Specs that assert on balance
 * movement use this instead of the seeded wallet so they stay order-independent.
 */
export async function createWallet(
  initial: Partial<Record<Currency, number>> = {},
): Promise<number> {
  const [wallet] = await db.insert(wallets).values({}).returning();

  await db.insert(walletBalances).values(
    CURRENCIES.map((currency) => ({
      wallet_id: wallet.id,
      currency,
      amount: initial[currency] ?? 0,
    })),
  );

  return wallet.id;
}
