import request from 'supertest';
import app from '../src/app';

describe('GET /api/wallet', () => {
  it('should return 200 and all 5 seeded currency balances', async () => {
    const response = await request(app).get('/api/wallet');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(5);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ currency: 'USD', amount: 100000 }),
        expect.objectContaining({ currency: 'JPY', amount: 0 }),
        expect.objectContaining({ currency: 'EUR', amount: 0 }),
        expect.objectContaining({ currency: 'GBP', amount: 0 }),
        expect.objectContaining({ currency: 'CNY', amount: 0 }),
      ]),
    );
  });
});
