import { integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { wallet } from './wallet';

export const exchangeTransaction = pgTable('exchange_transaction', {
  id: serial('id').primaryKey(),
  wallet_id: integer('wallet_id')
    .notNull()
    .references(() => wallet.id),
  from_currency: text('from_currency').notNull(),
  to_currency: text('to_currency').notNull(),
  // Both amounts are stored in their own currency's minor unit.
  from_amount: integer('from_amount').notNull(),
  to_amount: integer('to_amount').notNull(),
  rate: numeric('rate', { precision: 20, scale: 10 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ExchangeTransactionInsertType = typeof exchangeTransaction.$inferInsert;
