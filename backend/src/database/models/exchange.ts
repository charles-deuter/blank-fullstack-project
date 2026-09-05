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

// Append-only: nothing updates or deletes a row here.
export const exchanges = pgTable('exchanges', {
  id: serial('id').primaryKey(),
  wallet_id: integer('wallet_id')
    .notNull()
    .references(() => wallets.id),
  from_currency: text('from_currency').notNull(),
  to_currency: text('to_currency').notNull(),
  from_amount: bigint('from_amount', { mode: 'bigint' }).notNull(),
  to_amount: bigint('to_amount', { mode: 'bigint' }).notNull(),
  // Rates are frozen into the row rather than recomputed at read time, so
  // editing the constants file later cannot rewrite what actually happened.
  from_rate_usd: numeric('from_rate_usd', { precision: 20, scale: 10 }).notNull(),
  to_rate_usd: numeric('to_rate_usd', { precision: 20, scale: 10 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ExchangeInsertType = typeof exchanges.$inferInsert;
export type ExchangeSelectType = typeof exchanges.$inferSelect;
