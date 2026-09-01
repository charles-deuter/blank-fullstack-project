import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const foo = pgTable('foo', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});
