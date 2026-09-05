import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type WalletInsertType = typeof wallets.$inferInsert;
export type WalletSelectType = typeof wallets.$inferSelect;
