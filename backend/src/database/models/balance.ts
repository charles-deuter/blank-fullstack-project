import { bigint, integer, pgTable, serial, text, unique } from 'drizzle-orm/pg-core';
import { wallets } from './wallet';

export const balances = pgTable(
  'balances',
  {
    id: serial('id').primaryKey(),
    wallet_id: integer('wallet_id')
      .notNull()
      .references(() => wallets.id),
    currency: text('currency').notNull(),
    // Minor units, never negative. `mode: 'bigint'` keeps the value a JS bigint
    // rather than a lossy number on the way out of the driver.
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
  },
  (table) => [
    unique('balances_wallet_currency_unique').on(table.wallet_id, table.currency),
  ],
);

export type BalanceInsertType = typeof balances.$inferInsert;
export type BalanceSelectType = typeof balances.$inferSelect;
