import { integer, pgTable, serial, text, unique } from 'drizzle-orm/pg-core';
import { wallet } from './wallet';

export const walletBalance = pgTable(
  'wallet_balance',
  {
    id: serial('id').primaryKey(),
    wallet_id: integer('wallet_id')
      .notNull()
      .references(() => wallet.id),
    currency: text('currency').notNull(),
    // Stored in the currency's minor unit: cents for USD/EUR/GBP/CNY, whole yen for JPY.
    amount: integer('amount').notNull().default(0),
  },
  (table) => [
    unique('wallet_balance_wallet_currency_key').on(table.wallet_id, table.currency),
  ],
);

export type WalletBalanceInsertType = typeof walletBalance.$inferInsert;
