import request from 'supertest';
import app from '../src/app';
import { createWallet } from './helpers/wallet';

const SEEDED_WALLET_ID = 1;

describe('GET /api/wallets/:id', () => {
  it('should return the seeded wallet with $1,000 USD and zero elsewhere', async () => {
    const response = await request(app).get(`/api/wallets/${SEEDED_WALLET_ID}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(SEEDED_WALLET_ID);
    expect(response.body.balances).toEqual([
      { currency: 'USD', amount: 100000, decimals: 2, usdEquivalent: 100000 },
      { currency: 'EUR', amount: 0, decimals: 2, usdEquivalent: 0 },
      { currency: 'GBP', amount: 0, decimals: 2, usdEquivalent: 0 },
      { currency: 'JPY', amount: 0, decimals: 0, usdEquivalent: 0 },
      { currency: 'CNY', amount: 0, decimals: 2, usdEquivalent: 0 },
    ]);
    expect(response.body.totalUsd).toBe(100000);
  });

  it('should report USD equivalents and a total across currencies', async () => {
    // 100.00 EUR -> 110.00 USD, 10000 JPY -> 67.00 USD.
    const walletId = await createWallet({ EUR: 10000, JPY: 10000 });

    const response = await request(app).get(`/api/wallets/${walletId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.balances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ currency: 'EUR', amount: 10000, usdEquivalent: 11000 }),
        expect.objectContaining({ currency: 'JPY', amount: 10000, usdEquivalent: 6700 }),
      ]),
    );
    expect(response.body.totalUsd).toBe(17700);
  });

  it('should report JPY with zero decimals', async () => {
    const response = await request(app).get(`/api/wallets/${SEEDED_WALLET_ID}`);

    const jpy = response.body.balances.find(
      (balance: { currency: string }) => balance.currency === 'JPY',
    );

    expect(jpy.decimals).toBe(0);
  });

  it('should return 404 for a wallet that does not exist', async () => {
    const response = await request(app).get('/api/wallets/999999');

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toEqual(expect.any(String));
  });

  it.each([
    ['a non-numeric id', 'abc'],
    ['a zero id', '0'],
    ['a negative id', '-1'],
  ])('should return 400 for %s', async (_label, id) => {
    const response = await request(app).get(`/api/wallets/${id}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual(expect.any(String));
  });
});
