import { db } from '../db';
import { foo } from '../models/foo';

export async function findALL() {
  return db.select().from(foo);
}
