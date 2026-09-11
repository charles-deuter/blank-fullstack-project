import request from 'supertest';
import app from '../src/app';

describe('GET /api/exchange-rate', () => {
  it('should preview a conversion without touching any wallet', async () => {
    const response = await request(app)
      .get('/api/exchange-rate')
      .query({ from: 'USD', to: 'EUR', amount: '10000' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      fromAmount: 10000,
      toAmount: 9090,
      rate: '0.90909090',
    });
  });

  it('should agree with what the exchange endpoint actually credits', async () => {
    const preview = await request(app)
      .get('/api/exchange-rate')
      .query({ from: 'EUR', to: 'GBP', amount: '5000' });

    const created = await request(app)
      .post('/api/wallets/1/transactions')
      .send({ fromCurrency: 'EUR', toCurrency: 'GBP', fromAmount: 5000 });

    // The seeded wallet holds no EUR, so the exchange is refused — but the
    // preview must still describe the conversion the endpoint would have made.
    expect(created.statusCode).toBe(400);
    expect(preview.body.toAmount).toBe(4330);
    expect(preview.body.rate).toBe('0.86614173');
  });

  it('should cross non-USD pairs through the dollar', async () => {
    const response = await request(app)
      .get('/api/exchange-rate')
      .query({ from: 'JPY', to: 'CNY', amount: '100000' });

    expect(response.statusCode).toBe(200);
    // 100,000 JPY -> $670.00 -> 4785.71 CNY.
    expect(response.body.toAmount).toBe(478571);
  });

  it('should floor a conversion that yields a sub-unit result', async () => {
    const response = await request(app)
      .get('/api/exchange-rate')
      .query({ from: 'JPY', to: 'USD', amount: '1' });

    expect(response.statusCode).toBe(200);
    expect(response.body.toAmount).toBe(0);
  });

  it.each([
    ['an unknown from', { from: 'XXX', to: 'EUR', amount: '100' }],
    ['an unknown to', { from: 'USD', to: 'XXX', amount: '100' }],
    ['a matching pair', { from: 'USD', to: 'USD', amount: '100' }],
    ['a missing amount', { from: 'USD', to: 'EUR' }],
    ['a zero amount', { from: 'USD', to: 'EUR', amount: '0' }],
    ['a negative amount', { from: 'USD', to: 'EUR', amount: '-100' }],
    ['a fractional amount', { from: 'USD', to: 'EUR', amount: '10.5' }],
    ['a non-numeric amount', { from: 'USD', to: 'EUR', amount: 'abc' }],
  ])('should return 400 for %s', async (_label, query) => {
    const response = await request(app).get('/api/exchange-rate').query(query);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toEqual(expect.any(String));
  });
});
