import request from 'supertest';
import app from '../src/app';

describe('POST /api/exchanges', () => {
  it('should exchange 100 USD (10000 cents) to JPY and return 201', async () => {
    const response = await request(app)
      .post('/api/exchanges')
      .send({ from_currency: 'USD', to_currency: 'JPY', amount: 10000 });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        from_currency: 'USD',
        to_currency: 'JPY',
        from_amount: 10000,
        to_amount: 14950,
        rate_used: expect.any(String),
      }),
    );
    expect(Date.parse(response.body.created_at)).not.toBeNaN();
  });

  it('should update wallet balances after exchange', async () => {
    const walletBefore = await request(app).get('/api/wallet');
    const usdBefore = walletBefore.body.find((b: any) => b.currency === 'USD').amount;
    const jpyBefore = walletBefore.body.find((b: any) => b.currency === 'JPY').amount;

    await request(app)
      .post('/api/exchanges')
      .send({ from_currency: 'USD', to_currency: 'JPY', amount: 5000 });

    const walletAfter = await request(app).get('/api/wallet');
    const usdAfter = walletAfter.body.find((b: any) => b.currency === 'USD').amount;
    const jpyAfter = walletAfter.body.find((b: any) => b.currency === 'JPY').amount;

    expect(usdAfter).toBe(usdBefore - 5000);
    expect(jpyAfter).toBe(jpyBefore + 7475);
  });

  it('should reject exchange when balance is insufficient', async () => {
    const response = await request(app)
      .post('/api/exchanges')
      .send({ from_currency: 'EUR', to_currency: 'USD', amount: 1 });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('Insufficient');
  });

  it.each([
    ['missing from_currency', { to_currency: 'JPY', amount: 100 }],
    ['missing to_currency', { from_currency: 'USD', amount: 100 }],
    ['missing amount', { from_currency: 'USD', to_currency: 'JPY' }],
    ['invalid from_currency', { from_currency: 'XXX', to_currency: 'JPY', amount: 100 }],
    ['same currency', { from_currency: 'USD', to_currency: 'USD', amount: 100 }],
    ['negative amount', { from_currency: 'USD', to_currency: 'JPY', amount: -100 }],
    ['non-integer amount', { from_currency: 'USD', to_currency: 'JPY', amount: 10.5 }],
  ])('should return 400 for %s', async (_label, body) => {
    const response = await request(app).post('/api/exchanges').send(body);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual(expect.any(String));
  });
});

describe('GET /api/exchanges', () => {
  it('should return exchange history ordered most recent first', async () => {
    const response = await request(app).get('/api/exchanges');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].id).toBeGreaterThan(
      response.body[response.body.length - 1].id,
    );
  });
});
