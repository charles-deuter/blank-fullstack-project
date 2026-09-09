import { pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

export const wallet = pgTable('wallet', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type WalletInsertType = typeof wallet.$inferInsert;
