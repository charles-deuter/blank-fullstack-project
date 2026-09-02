import { bigint, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// A wallet is the user. There is no separate users table and no auth; the wallet
// row is the whole identity for now.
export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  display_name: text('display_name').notNull(),
  // Money is integer cents everywhere. $100.00 is 10000, never 100.0.
  balance_cents: bigint('balance_cents', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type WalletInsertType = typeof wallets.$inferInsert;
export type WalletSelectType = typeof wallets.$inferSelect;
