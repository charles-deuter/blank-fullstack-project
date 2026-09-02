import { desc } from 'drizzle-orm';
import { db } from '../db';
import { foo } from '../models/foo';

export async function create(name: string) {
  const [created] = await db.insert(foo).values({ name }).returning();

  return created;
}

export async function findALL() {
  // id breaks ties: rows sharing a created_at would otherwise come back in an
  // undefined order that can shuffle between queries.
  return db.select().from(foo).orderBy(desc(foo.created_at), desc(foo.id));
}
