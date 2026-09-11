import {
  bigint,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { wallets } from './wallet';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  wallet_id: integer('wallet_id')
    .notNull()
    .references(() => wallets.id),
  from_currency: text('from_currency').notNull(),
  to_currency: text('to_currency').notNull(),
  // Both amounts are in their own currency's smallest unit.
  from_amount: bigint('from_amount', { mode: 'number' }).notNull(),
  to_amount: bigint('to_amount', { mode: 'number' }).notNull(),
  // Major-unit rate at exchange time: one from_currency bought this many to_currency.
  exchange_rate: numeric('exchange_rate', { precision: 20, scale: 8 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TransactionInsertType = typeof transactions.$inferInsert;
export type TransactionSelectType = typeof transactions.$inferSelect;
