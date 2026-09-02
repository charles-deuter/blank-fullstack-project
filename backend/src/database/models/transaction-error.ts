import { bigint, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Every reason a transfer can be rejected. The same vocabulary is the `reason`
// column and the route's status-code mapping.
export const TRANSFER_FAILURE_REASONS = [
  'INVALID_AMOUNT',
  'SELF_TRANSFER',
  'SENDER_NOT_FOUND',
  'RECIPIENT_NOT_FOUND',
  'INSUFFICIENT_FUNDS',
] as const;

export type TransferFailureReason = (typeof TRANSFER_FAILURE_REASONS)[number];

// This is a log, not a relational entity. The wallet columns deliberately carry NO
// foreign key: RECIPIENT_NOT_FOUND has to record an id that never existed, and an
// FK would refuse the row. Adding the constraint breaks the taxonomy.
export const transactionErrors = pgTable('transaction_errors', {
  id: serial('id').primaryKey(),
  sender_wallet_id: bigint('sender_wallet_id', { mode: 'number' }),
  recipient_wallet_id: bigint('recipient_wallet_id', { mode: 'number' }),
  amount_cents: bigint('amount_cents', { mode: 'number' }),
  reason: text('reason').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TransactionErrorInsertType = typeof transactionErrors.$inferInsert;
export type TransactionErrorSelectType = typeof transactionErrors.$inferSelect;
