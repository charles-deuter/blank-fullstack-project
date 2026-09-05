import request from 'supertest';
import app from '../src/app';

describe('GET /api/wallets/:walletId', () => {
  it('should return the seeded wallet with all five balances', async () => {
    const response = await request(app).get('/api/wallets/1');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({ id: 1, name: 'Demo Wallet' }),
    );
    expect(response.body.balances).toHaveLength(5);
  });

  it('should return the seeded amounts, exponents and USD values as strings', async () => {
    const response = await request(app).get('/api/wallets/1');

    // Amounts and USD values from the PRD seed table; bigints cross the API as
    // decimal strings of minor units because JSON cannot carry a bigint.
    expect(response.body.balances).toEqual([
      { currency: 'USD', amount: '16423', exponent: 2, usdValue: '16423' },
      { currency: 'EUR', amount: '17361', exponent: 2, usdValue: '18749' },
      { currency: 'GBP', amount: '8890', exponent: 2, usdValue: '11290' },
      { currency: 'CNY', amount: '102571', exponent: 2, usdValue: '14359' },
      { currency: 'JPY', amount: '26626', exponent: 0, usdValue: '17839' },
    ]);
  });

  it('should return the wallet total in USD minor units', async () => {
    const response = await request(app).get('/api/wallets/1');

    expect(response.body.totalUsd).toBe('78660');
  });

  it('should ride the rate table along with the wallet', async () => {
    const response = await request(app).get('/api/wallets/1');

    expect(response.body.rates).toEqual({
      USD: '1.00',
      EUR: '1.08',
      GBP: '1.27',
      CNY: '0.14',
      JPY: '0.0067',
    });
  });

  it('should return 404 when the wallet does not exist', async () => {
    const response = await request(app).get('/api/wallets/9999');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ success: false, message: 'wallet not found' });
  });

  it.each([
    ['zero', '0'],
    ['negative', '-1'],
    ['non-numeric', 'abc'],
    ['fractional', '1.5'],
  ])('should return 400 for a %s walletId', async (_label, walletId) => {
    const response = await request(app).get(`/api/wallets/${walletId}`);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'walletId must be a positive integer',
    });
  });
});
