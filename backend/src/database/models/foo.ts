import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const foo = pgTable('foo', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});


export type FooInsertType = typeof foo.$inferInsert