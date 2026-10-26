import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const foo = pgTable('foo', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  // The defaults only make the migration safe on a populated table; the API
  // requires every one of these fields on create.
  category: text('category').notNull().default('general'),
  priority: text('priority').notNull().default('medium'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type FooInsertType = typeof foo.$inferInsert;
