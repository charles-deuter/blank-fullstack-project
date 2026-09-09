import request from 'supertest';
import { eq } from 'drizzle-orm';
import app from '../src/app';
import { db } from '../src/database/db';
import { exchangeTransaction } from '../src/database/models/exchangeTransaction';
import { walletBalance } from '../src/database/models/walletBalance';

const SEEDED_USD = 100000;

async function resetWallet() {
  await db.delete(exchangeTransaction);
  await db.update(walletBalance).set({ amount: 0 });
  await db
    .update(walletBalance)
    .set({ amount: SEEDED_USD })
    .where(eq(walletBalance.currency, 'USD'));
}

async function balances(): Promise<Record<string, number>> {
  const response = await request(app).get('/api/wallets/1/balances');

  return Object.fromEntries(
    response.body.map((b: { currency: string; amount: number }) => [
      b.currency,
      b.amount,
    ]),
  );
}

function exchange(body: object) {
  return request(app).post('/api/wallets/1/exchange').send(body);
}

beforeEach(resetWallet);

describe('POST /api/wallets/:id/exchange', () => {
  it('should return 201 with the created transaction', async () => {
    const response = await exchange({
      from_currency: 'USD',
      to_currency: 'EUR',
      from_amount: 100,
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        wallet_id: 1,
        from_currency: 'USD',
        to_currency: 'EUR',
        from_amount: 10000,
        to_amount: 9200,
        rate: 0.92,
      }),
    );
    expect(Date.parse(response.body.created_at)).not.toBeNaN();
  });

  it('should debit the source currency and credit the target', async () => {
    await exchange({ from_currency: 'USD', to_currency: 'EUR', from_amount: 100 });

    expect(await balances()).toEqual({
      USD: 90000,
      EUR: 9200,
      GBP: 0,
      JPY: 0,
      CNY: 0,
    });
  });

  it('should leave the other currencies untouched', async () => {
    await exchange({ from_currency: 'USD', to_currency: 'JPY', from_amount: 100 });

    const after = await balances();

    expect(after.JPY).toBe(15000);
    expect(after.EUR).toBe(0);
    expect(after.GBP).toBe(0);
    expect(after.CNY).toBe(0);
  });

  it('should floor a conversion that lands on a fractional cent', async () => {
    // 1001 cents * 0.92 = 920.92 -> floors to 920
    const response = await exchange({
      from_currency: 'USD',
      to_currency: 'EUR',
      from_amount: 10.01,
    });

    expect(response.body.to_amount).toBe(920);
    expect((await balances()).EUR).toBe(920);
  });

  it('should floor a sub-cent amount in the request before debiting', async () => {
    const response = await exchange({
      from_currency: 'USD',
      to_currency: 'EUR',
      from_amount: 10.019,
    });

    expect(response.body.from_amount).toBe(1001);
    expect((await balances()).USD).toBe(SEEDED_USD - 1001);
  });

  it('should convert through USD when neither side is the base currency', async () => {
    await exchange({ from_currency: 'USD', to_currency: 'EUR', from_amount: 100 });

    const response = await exchange({
      from_currency: 'EUR',
      to_currency: 'JPY',
      from_amount: 92,
    });

    // EUR 92 -> $100 -> 15000 yen
    expect(response.body.to_amount).toBe(15000);
  });

  it('should allow draining a currency to exactly zero', async () => {
    const response = await exchange({
      from_currency: 'USD',
      to_currency: 'GBP',
      from_amount: 1000,
    });

    expect(response.statusCode).toBe(201);
    expect((await balances()).USD).toBe(0);
  });

  it('should reject a second exchange once the balance is drained', async () => {
    await exchange({ from_currency: 'USD', to_currency: 'GBP', from_amount: 1000 });

    const response = await exchange({
      from_currency: 'USD',
      to_currency: 'EUR',
      from_amount: 1,
    });

    expect(response.statusCode).toBe(400);
  });

  it('should accumulate across several exchanges into the same currency', async () => {
    await exchange({ from_currency: 'USD', to_currency: 'EUR', from_amount: 100 });
    await exchange({ from_currency: 'USD', to_currency: 'EUR', from_amount: 100 });

    expect((await balances()).EUR).toBe(18400);
  });
});

describe('POST /api/wallets/:id/exchange validation', () => {
  it.each([
    ['a missing body', {}],
    ['a missing from_currency', { to_currency: 'EUR', from_amount: 10 }],
    ['a missing to_currency', { from_currency: 'USD', from_amount: 10 }],
    ['a missing from_amount', { from_currency: 'USD', to_currency: 'EUR' }],
    [
      'an unsupported from_currency',
      { from_currency: 'CHF', to_currency: 'EUR', from_amount: 10 },
    ],
    [
      'an unsupported to_currency',
      { from_currency: 'USD', to_currency: 'CHF', from_amount: 10 },
    ],
    [
      'a lowercase currency',
      { from_currency: 'usd', to_currency: 'EUR', from_amount: 10 },
    ],
    [
      'identical currencies',
      { from_currency: 'USD', to_currency: 'USD', from_amount: 10 },
    ],
    ['a zero amount', { from_currency: 'USD', to_currency: 'EUR', from_amount: 0 }],
    ['a negative amount', { from_currency: 'USD', to_currency: 'EUR', from_amount: -5 }],
    [
      'a non-numeric amount',
      { from_currency: 'USD', to_currency: 'EUR', from_amount: 'ten' },
    ],
    [
      'an amount that floors to zero minor units',
      { from_currency: 'USD', to_currency: 'EUR', from_amount: 0.004 },
    ],
    [
      'an amount larger than the balance',
      { from_currency: 'USD', to_currency: 'EUR', from_amount: 1000.01 },
    ],
    [
      'a currency with no balance',
      { from_currency: 'JPY', to_currency: 'USD', from_amount: 1 },
    ],
  ])('should return 400 for %s', async (_label, body) => {
    const response = await exchange(body);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual(expect.any(String));
  });

  it('should not modify any balance when validation fails', async () => {
    const before = await balances();

    await exchange({ from_currency: 'USD', to_currency: 'EUR', from_amount: 99999 });

    expect(await balances()).toEqual(before);
  });

  it('should not record a transaction when validation fails', async () => {
    await exchange({ from_currency: 'USD', to_currency: 'USD', from_amount: 10 });

    const response = await request(app).get('/api/wallets/1/transactions');

    expect(response.body).toEqual([]);
  });

  it('should return 404 for a wallet that does not exist', async () => {
    const response = await request(app)
      .post('/api/wallets/999/exchange')
      .send({ from_currency: 'USD', to_currency: 'EUR', from_amount: 10 });

    expect(response.statusCode).toBe(404);
  });

  it('should return 400 for a non-numeric wallet id', async () => {
    const response = await request(app)
      .post('/api/wallets/abc/exchange')
      .send({ from_currency: 'USD', to_currency: 'EUR', from_amount: 10 });

    expect(response.statusCode).toBe(400);
  });
});
