import request from 'supertest';
import app from '../src/app';
import { db } from '../src/database/db';
import { foo } from '../src/database/schema';

const fooFixture = [
  { id: 1, name: 'bar' },
  { id: 2, name: 'baz' },
];

describe('GET /api/foo', () => {
  beforeAll(async () => {
    await db.insert(foo).values(fooFixture);
  });

  it('should return 200 OK and contain expected body', async () => {
    const response = await request(app).get('/api/foo');

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(fooFixture);
  });
});
