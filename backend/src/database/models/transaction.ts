import { bigint, integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import { wallets } from './wallet';

// A row here means money moved. Rejected attempts live in transaction_errors, so
// there is no status column and nothing to filter out.
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  sender_wallet_id: integer('sender_wallet_id')
    .notNull()
    .references(() => wallets.id),
  recipient_wallet_id: integer('recipient_wallet_id')
    .notNull()
    .references(() => wallets.id),
  amount_cents: bigint('amount_cents', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TransactionInsertType = typeof transactions.$inferInsert;
export type TransactionSelectType = typeof transactions.$inferSelect;
