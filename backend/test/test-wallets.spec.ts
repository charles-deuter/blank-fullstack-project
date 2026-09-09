import request from 'supertest';
import app from '../src/app';

describe('GET /api/wallets/:id/balances', () => {
  it('should return the seeded wallet with 1000 USD and zero elsewhere', async () => {
    const response = await request(app).get('/api/wallets/1/balances');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(5);

    const amounts = Object.fromEntries(
      response.body.map((b: { currency: string; amount: number }) => [
        b.currency,
        b.amount,
      ]),
    );

    expect(amounts).toEqual({ USD: 100000, EUR: 0, GBP: 0, JPY: 0, CNY: 0 });
  });

  it('should return balances in a stable currency order', async () => {
    const first = await request(app).get('/api/wallets/1/balances');
    const second = await request(app).get('/api/wallets/1/balances');

    expect(first.body.map((b: { currency: string }) => b.currency)).toEqual(
      second.body.map((b: { currency: string }) => b.currency),
    );
  });

  it('should return 404 for a wallet that does not exist', async () => {
    const response = await request(app).get('/api/wallets/999/balances');

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toEqual(expect.any(String));
  });

  it('should return 400 for a non-numeric wallet id', async () => {
    const response = await request(app).get('/api/wallets/abc/balances');

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual(expect.any(String));
  });
});

describe('GET /api/wallets/:id/transactions', () => {
  it('should return an empty list before any exchange happens', async () => {
    const response = await request(app).get('/api/wallets/1/transactions');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return 404 for a wallet that does not exist', async () => {
    const response = await request(app).get('/api/wallets/999/transactions');

    expect(response.statusCode).toBe(404);
  });

  it('should return the most recent exchange first', async () => {
    await request(app)
      .post('/api/wallets/1/exchange')
      .send({ from_currency: 'USD', to_currency: 'EUR', from_amount: 10 });
    const newer = await request(app)
      .post('/api/wallets/1/exchange')
      .send({ from_currency: 'USD', to_currency: 'GBP', from_amount: 10 });

    const response = await request(app).get('/api/wallets/1/transactions');

    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toBe(newer.body.id);
    expect(response.body[0].to_currency).toBe('GBP');
  });
});
