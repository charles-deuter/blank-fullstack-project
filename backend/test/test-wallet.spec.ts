import request from 'supertest';
import app from '../src/app';

// The seed migration runs against every spec file's container, so these ten rows
// exist in every test. See migrations/*_seed_wallets.sql.
const SEEDED_WALLET_COUNT = 10;
const MIN_SEEDED_BALANCE_CENTS = 10000; // $100.00
const MAX_SEEDED_BALANCE_CENTS = 100000; // $1000.00

describe('GET /api/wallets', () => {
  it('should return the ten seeded wallets', async () => {
    const response = await request(app).get('/api/wallets');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(SEEDED_WALLET_COUNT);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        display_name: expect.any(String),
        balance_cents: expect.any(Number),
      }),
    );
  });

  it('should seed every balance between $100 and $1000 inclusive', async () => {
    const response = await request(app).get('/api/wallets');

    for (const wallet of response.body) {
      expect(wallet.balance_cents).toBeGreaterThanOrEqual(MIN_SEEDED_BALANCE_CENTS);
      expect(wallet.balance_cents).toBeLessThanOrEqual(MAX_SEEDED_BALANCE_CENTS);
    }
  });

  it('should seed balances that pin both ends of the range', async () => {
    const response = await request(app).get('/api/wallets');
    const balances = response.body.map((wallet: { balance_cents: number }) => {
      return wallet.balance_cents;
    });

    expect(Math.min(...balances)).toBe(MIN_SEEDED_BALANCE_CENTS);
    expect(Math.max(...balances)).toBe(MAX_SEEDED_BALANCE_CENTS);
  });

  it('should order deterministically, newest first', async () => {
    // The ten seeded rows share a created_at, so the id tiebreak is what makes this
    // stable rather than shuffling between queries.
    const response = await request(app).get('/api/wallets');
    const ids = response.body.map((wallet: { id: number }) => wallet.id);

    expect(ids).toEqual([...ids].sort((a: number, b: number) => b - a));
  });
});

describe('GET /api/wallets/:id', () => {
  it('should return a single wallet', async () => {
    const list = await request(app).get('/api/wallets');
    const expected = list.body[0];

    const response = await request(app).get(`/api/wallets/${expected.id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expected.id,
        display_name: expected.display_name,
        balance_cents: expected.balance_cents,
      }),
    );
  });

  it.each([
    ['an unknown id', '999999'],
    ['a non-numeric id', 'not-a-number'],
    ['a negative id', '-1'],
  ])('should return 404 for %s', async (_label, id) => {
    const response = await request(app).get(`/api/wallets/${id}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toEqual(expect.any(String));
  });
});
