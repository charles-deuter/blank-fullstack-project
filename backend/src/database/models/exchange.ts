import { pgTable, serial, text, bigint, timestamp } from 'drizzle-orm/pg-core';

export const exchanges = pgTable('exchanges', {
  id: serial('id').primaryKey(),
  from_currency: text('from_currency').notNull(),
  to_currency: text('to_currency').notNull(),
  from_amount: bigint('from_amount', { mode: 'number' }).notNull(),
  to_amount: bigint('to_amount', { mode: 'number' }).notNull(),
  rate_used: text('rate_used').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ExchangeInsertType = typeof exchanges.$inferInsert;
