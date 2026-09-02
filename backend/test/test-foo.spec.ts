import request from 'supertest';
import app from '../src/app';
import { db } from '../src/database/db';
import { foo } from '../src/database/schema';

// Deliberately spaced so ordering assertions can't tie, and deliberately
// inserted out of order so passing proves a sort rather than insertion order.
const OLDEST = new Date('2026-01-01T00:00:00.000Z');
const MIDDLE = new Date('2026-02-01T00:00:00.000Z');
const NEWEST = new Date('2026-03-01T00:00:00.000Z');

const fooFixture = [
  { id: 1, name: 'bar', created_at: MIDDLE },
  { id: 2, name: 'baz', created_at: OLDEST },
  { id: 3, name: 'qux', created_at: NEWEST },
];

describe('GET /api/foo', () => {
  beforeAll(async () => {
    await db.insert(foo).values(fooFixture);
  });

  it('should return 200 OK and every foo record', async () => {
    const response = await request(app).get('/api/foo');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(fooFixture.length);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: 'bar' }),
        expect.objectContaining({ id: 2, name: 'baz' }),
        expect.objectContaining({ id: 3, name: 'qux' }),
      ]),
    );
  });

  it('should return records from most recent to least recent', async () => {
    const response = await request(app).get('/api/foo');

    expect(response.body.map((row: { id: number }) => row.id)).toEqual([3, 1, 2]);
    expect(response.body.map((row: { created_at: string }) => row.created_at)).toEqual([
      NEWEST.toISOString(),
      MIDDLE.toISOString(),
      OLDEST.toISOString(),
    ]);
  });
});
