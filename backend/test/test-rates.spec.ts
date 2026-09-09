import request from 'supertest';
import app from '../src/app';

describe('GET /api/rates', () => {
  it('should return 200 with USD as the base currency', async () => {
    const response = await request(app).get('/api/rates');

    expect(response.statusCode).toBe(200);
    expect(response.body.base).toBe('USD');
  });

  it('should return all five currencies with rates and decimals', async () => {
    const response = await request(app).get('/api/rates');

    expect(response.body.currencies).toHaveLength(5);
    expect(response.body.currencies).toEqual(
      expect.arrayContaining([
        { code: 'USD', rate: 1, decimals: 2 },
        { code: 'EUR', rate: expect.any(Number), decimals: 2 },
        { code: 'GBP', rate: expect.any(Number), decimals: 2 },
        { code: 'JPY', rate: expect.any(Number), decimals: 0 },
        { code: 'CNY', rate: expect.any(Number), decimals: 2 },
      ]),
    );
  });

  it('should quote every non-base rate as a positive number', async () => {
    const response = await request(app).get('/api/rates');

    for (const currency of response.body.currencies) {
      expect(currency.rate).toBeGreaterThan(0);
    }
  });
});
