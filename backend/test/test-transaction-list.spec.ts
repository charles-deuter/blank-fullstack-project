import request from 'supertest';
import app from '../src/app';
import { createWallet } from './helpers/wallet';

describe('GET /api/wallets/:id/transactions', () => {
  it('should return an empty list for a wallet with no exchanges', async () => {
    const walletId = await createWallet({ USD: 100000 });

    const response = await request(app).get(`/api/wallets/${walletId}/transactions`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return the most recent exchange first', async () => {
    const walletId = await createWallet({ USD: 100000 });

    await request(app)
      .post(`/api/wallets/${walletId}/transactions`)
      .send({ fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: 1000 });
    const newer = await request(app)
      .post(`/api/wallets/${walletId}/transactions`)
      .send({ fromCurrency: 'USD', toCurrency: 'GBP', fromAmount: 2000 });

    const response = await request(app).get(`/api/wallets/${walletId}/transactions`);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toBe(newer.body.id);
    expect(response.body[0].to_currency).toBe('GBP');
  });

  it('should only return exchanges belonging to the requested wallet', async () => {
    const walletId = await createWallet({ USD: 100000 });
    const otherWalletId = await createWallet({ USD: 100000 });

    await request(app)
      .post(`/api/wallets/${otherWalletId}/transactions`)
      .send({ fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: 1000 });

    const response = await request(app).get(`/api/wallets/${walletId}/transactions`);

    expect(response.body).toEqual([]);
  });

  it('should record each exchange with its amounts and rate', async () => {
    const walletId = await createWallet({ USD: 100000 });

    await request(app)
      .post(`/api/wallets/${walletId}/transactions`)
      .send({ fromCurrency: 'USD', toCurrency: 'CNY', fromAmount: 10000 });

    const response = await request(app).get(`/api/wallets/${walletId}/transactions`);

    expect(response.body[0]).toEqual(
      expect.objectContaining({
        from_currency: 'USD',
        to_currency: 'CNY',
        from_amount: 10000,
        // $100.00 at 1 CNY = $0.14 buys 714.28 CNY.
        to_amount: 71428,
        exchange_rate: '7.14285714',
      }),
    );
    expect(Date.parse(response.body[0].created_at)).not.toBeNaN();
  });

  it('should return 404 for a wallet that does not exist', async () => {
    const response = await request(app).get('/api/wallets/999999/transactions');

    expect(response.statusCode).toBe(404);
  });
});
