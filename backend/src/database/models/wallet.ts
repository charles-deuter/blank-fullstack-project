import {
  bigint,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const walletBalances = pgTable(
  'wallet_balances',
  {
    id: serial('id').primaryKey(),
    wallet_id: integer('wallet_id')
      .notNull()
      .references(() => wallets.id),
    currency: text('currency').notNull(),
    // Held in the currency's smallest unit: cents for USD/EUR/GBP/CNY, yen for JPY.
    amount: bigint('amount', { mode: 'number' }).notNull().default(0),
  },
  (table) => [
    unique('wallet_balances_wallet_currency').on(table.wallet_id, table.currency),
  ],
);

export type WalletInsertType = typeof wallets.$inferInsert;
export type WalletBalanceInsertType = typeof walletBalances.$inferInsert;
