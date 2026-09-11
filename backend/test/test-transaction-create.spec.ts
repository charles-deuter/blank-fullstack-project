import request from 'supertest';
import app from '../src/app';
import { createWallet } from './helpers/wallet';

async function balanceOf(walletId: number, currency: string): Promise<number> {
  const response = await request(app).get(`/api/wallets/${walletId}`);

  return response.body.balances.find(
    (balance: { currency: string }) => balance.currency === currency,
  ).amount;
}

describe('POST /api/wallets/:id/transactions', () => {
  it('should return 201 with the converted amount and effective rate', async () => {
    const walletId = await createWallet({ USD: 100000 });

    const response = await request(app)
      .post(`/api/wallets/${walletId}/transactions`)
      .send({ fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: 10000 });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        wallet_id: walletId,
        from_currency: 'USD',
        to_currency: 'EUR',
        from_amount: 10000,
        // $100.00 at 1 EUR = $1.10 buys 90.90 EUR, the remainder is dropped.
        to_amount: 9090,
        exchange_rate: '0.90909090',
      }),
    );
  });

  it('should move both balances by exactly the exchanged amounts', async () => {
    const walletId = await createWallet({ USD: 100000 });

    await request(app)
      .post(`/api/wallets/${walletId}/transactions`)
      .send({ fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: 10000 });

    expect(await balanceOf(walletId, 'USD')).toBe(90000);
    expect(await balanceOf(walletId, 'EUR')).toBe(9090);
  });

  it('should round down to whole yen when converting into JPY', async () => {
    const walletId = await createWallet({ USD: 100000 });

    const response = await request(app)
      .post(`/api/wallets/${walletId}/transactions`)
      .send({ fromCurrency: 'USD', toCurrency: 'JPY', fromAmount: 10000 });

    expect(response.statusCode).toBe(201);
    expect(response.body.to_amount).toBe(14925);
    expect(response.body.exchange_rate).toBe('149.25373134');
  });

  it('should reject an exchange larger than the balance and leave it untouched', async () => {
    const walletId = await createWallet({ USD: 10000 });

    const response = await request(app)
      .post(`/api/wallets/${walletId}/transactions`)
      .send({ fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: 20000 });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual(expect.any(String));
    expect(await balanceOf(walletId, 'USD')).toBe(10000);
    expect(await balanceOf(walletId, 'EUR')).toBe(0);
  });

  it('should reject an exchange whose result rounds down to zero', async () => {
    // 1 JPY is worth $0.0067, which floors to zero cents.
    const walletId = await createWallet({ JPY: 100 });

    const response = await request(app)
      .post(`/api/wallets/${walletId}/transactions`)
      .send({ fromCurrency: 'JPY', toCurrency: 'USD', fromAmount: 1 });

    expect(response.statusCode).toBe(400);
    expect(await balanceOf(walletId, 'JPY')).toBe(100);
  });

  it('should allow spending the entire balance', async () => {
    const walletId = await createWallet({ USD: 10000 });

    const response = await request(app)
      .post(`/api/wallets/${walletId}/transactions`)
      .send({ fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: 10000 });

    expect(response.statusCode).toBe(201);
    expect(await balanceOf(walletId, 'USD')).toBe(0);
  });

  it.each([
    [
      'a same-currency exchange',
      { fromCurrency: 'USD', toCurrency: 'USD', fromAmount: 100 },
    ],
    [
      'an unknown fromCurrency',
      { fromCurrency: 'XXX', toCurrency: 'EUR', fromAmount: 100 },
    ],
    [
      'an unknown toCurrency',
      { fromCurrency: 'USD', toCurrency: 'XXX', fromAmount: 100 },
    ],
    ['a missing fromCurrency', { toCurrency: 'EUR', fromAmount: 100 }],
    ['a zero amount', { fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: 0 }],
    ['a negative amount', { fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: -100 }],
    ['a fractional amount', { fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: 10.5 }],
    ['a string amount', { fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: '100' }],
    ['a missing amount', { fromCurrency: 'USD', toCurrency: 'EUR' }],
  ])('should return 400 for %s', async (_label, body) => {
    const walletId = await createWallet({ USD: 100000 });

    const response = await request(app)
      .post(`/api/wallets/${walletId}/transactions`)
      .send(body);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual(expect.any(String));
  });

  it('should return 404 for a wallet that does not exist', async () => {
    const response = await request(app)
      .post('/api/wallets/999999/transactions')
      .send({ fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: 100 });

    expect(response.statusCode).toBe(404);
  });

  it('should not overdraw when concurrent exchanges race for the same funds', async () => {
    const walletId = await createWallet({ USD: 10000 });

    const exchange = () =>
      request(app)
        .post(`/api/wallets/${walletId}/transactions`)
        .send({ fromCurrency: 'USD', toCurrency: 'EUR', fromAmount: 10000 });

    const results = await Promise.all([exchange(), exchange()]);
    const accepted = results.filter((result) => result.statusCode === 201);

    expect(accepted).toHaveLength(1);
    expect(await balanceOf(walletId, 'USD')).toBe(0);
    expect(await balanceOf(walletId, 'EUR')).toBe(9090);
  });
});
