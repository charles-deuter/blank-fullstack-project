import request from 'supertest';
import app from '../src/app';

describe('GET /api/rates', () => {
  it('should return 200 with rates and currency metadata', async () => {
    const response = await request(app).get('/api/rates');

    expect(response.statusCode).toBe(200);
    expect(response.body.rates).toEqual({
      USD: 1,
      JPY: 149.5,
      EUR: 0.92,
      GBP: 0.79,
      CNY: 7.24,
    });
    expect(response.body.currencies.USD).toEqual({ decimalPlaces: 2, symbol: '$' });
    expect(response.body.currencies.JPY).toEqual({ decimalPlaces: 0, symbol: '¥' });
  });
});
