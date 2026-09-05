import { pgTable, serial, text, bigint } from 'drizzle-orm/pg-core';

export const walletBalances = pgTable('wallet_balances', {
  id: serial('id').primaryKey(),
  currency: text('currency').notNull().unique(),
  amount: bigint('amount', { mode: 'number' }).notNull().default(0),
});

export type WalletBalanceInsertType = typeof walletBalances.$inferInsert;
