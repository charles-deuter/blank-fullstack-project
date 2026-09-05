import request from 'supertest';
import app from '../src/app';
import { db } from '../src/database/db';
import { exchanges, ExchangeInsertType, wallets } from '../src/database/schema';

// Deliberately spaced so ordering assertions can't tie by accident, and
// inserted out of order so passing proves a sort rather than insertion order.
const OLDEST = new Date('2026-01-01T00:00:00.000Z');
const MIDDLE = new Date('2026-02-01T00:00:00.000Z');
const NEWEST = new Date('2026-03-01T00:00:00.000Z');

const exchangeFixture: ExchangeInsertType[] = [
  {
    id: 1,
    wallet_id: 1,
    from_currency: 'EUR',
    to_currency: 'JPY',
    from_amount: 5000n,
    to_amount: 8059n,
    from_rate_usd: '1.0800000000',
    to_rate_usd: '0.0067000000',
    created_at: MIDDLE,
  },
  {
    id: 2,
    wallet_id: 1,
    from_currency: 'GBP',
    to_currency: 'USD',
    from_amount: 1000n,
    to_amount: 1270n,
    from_rate_usd: '1.2700000000',
    to_rate_usd: '1.0000000000',
    created_at: OLDEST,
  },
  {
    id: 3,
    wallet_id: 1,
    from_currency: 'USD',
    to_currency: 'CNY',
    from_amount: 2000n,
    to_amount: 14285n,
    from_rate_usd: '1.0000000000',
    to_rate_usd: '0.1400000000',
    created_at: NEWEST,
  },
  // Shares a timestamp with id 3, so only the id tiebreak can order the two.
  {
    id: 4,
    wallet_id: 1,
    from_currency: 'CNY',
    to_currency: 'EUR',
    from_amount: 3000n,
    to_amount: 388n,
    from_rate_usd: '0.1400000000',
    to_rate_usd: '1.0800000000',
    created_at: NEWEST,
  },
];

describe('GET /api/wallets/:walletId/exchanges', () => {
  beforeAll(async () => {
    await db.insert(wallets).values({ id: 2, name: 'Empty Wallet' });
    await db.insert(exchanges).values(exchangeFixture);
  });

  it('should return every exchange for the wallet', async () => {
    const response = await request(app).get('/api/wallets/1/exchanges');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(exchangeFixture.length);
  });

  it('should return exchanges newest first, breaking ties by id', async () => {
    const response = await request(app).get('/api/wallets/1/exchanges');

    expect(response.body.map((row: { id: number }) => row.id)).toEqual([4, 3, 1, 2]);
  });

  it('should serialize amounts as strings and freeze the rates it was given', async () => {
    const response = await request(app).get('/api/wallets/1/exchanges');

    expect(response.body[3]).toEqual({
      id: 2,
      fromCurrency: 'GBP',
      toCurrency: 'USD',
      fromAmount: '1000',
      toAmount: '1270',
      fromRateUsd: '1.2700000000',
      toRateUsd: '1.0000000000',
      createdAt: OLDEST.toISOString(),
    });
  });

  it('should not leak one wallet exchanges into another', async () => {
    const response = await request(app).get('/api/wallets/2/exchanges');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return 404 for a wallet that does not exist', async () => {
    const response = await request(app).get('/api/wallets/9999/exchanges');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ success: false, message: 'wallet not found' });
  });

  it('should return 400 for a malformed walletId', async () => {
    const response = await request(app).get('/api/wallets/abc/exchanges');

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('walletId must be a positive integer');
  });
});
