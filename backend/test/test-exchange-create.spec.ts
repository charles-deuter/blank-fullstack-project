import request from 'supertest';
import app from '../src/app';

// The wallet seeded by the migration, per the PRD seed table.
const SEEDED = { USD: '16423', EUR: '17361', GBP: '8890', CNY: '102571', JPY: '26626' };

async function balancesOf(walletId = 1): Promise<Record<string, string>> {
  const response = await request(app).get(`/api/wallets/${walletId}`);

  return Object.fromEntries(
    response.body.balances.map((b: { currency: string; amount: string }) => [
      b.currency,
      b.amount,
    ]),
  );
}

describe('POST /api/wallets/:walletId/exchanges', () => {
  describe('rejections', () => {
    // Every rejection is a 400 distinguished by message, not by status code.
    it.each([
      [
        'a missing amount',
        { fromCurrency: 'EUR', toCurrency: 'JPY' },
        'amount must be a positive integer string',
      ],
      [
        'a numeric amount',
        { fromCurrency: 'EUR', toCurrency: 'JPY', amount: 5000 },
        'amount must be a positive integer string',
      ],
      [
        'a fractional amount',
        { fromCurrency: 'EUR', toCurrency: 'JPY', amount: '50.5' },
        'amount must be a positive integer string',
      ],
      [
        'a zero amount',
        { fromCurrency: 'EUR', toCurrency: 'JPY', amount: '0' },
        'amount must be a positive integer string',
      ],
      [
        'a negative amount',
        { fromCurrency: 'EUR', toCurrency: 'JPY', amount: '-5000' },
        'amount must be a positive integer string',
      ],
      [
        'an unknown fromCurrency',
        { fromCurrency: 'CHF', toCurrency: 'JPY', amount: '5000' },
        'unknown currency',
      ],
      [
        'an unknown toCurrency',
        { fromCurrency: 'EUR', toCurrency: 'chf', amount: '5000' },
        'unknown currency',
      ],
      [
        'a missing fromCurrency',
        { toCurrency: 'JPY', amount: '5000' },
        'unknown currency',
      ],
      [
        'matching currencies',
        { fromCurrency: 'EUR', toCurrency: 'EUR', amount: '5000' },
        'cannot exchange a currency for itself',
      ],
      [
        'an amount above the balance',
        { fromCurrency: 'EUR', toCurrency: 'JPY', amount: '17362' },
        'insufficient funds',
      ],
      [
        'an amount that floors to nothing',
        { fromCurrency: 'JPY', toCurrency: 'GBP', amount: '1' },
        'amount too small to exchange',
      ],
    ])('should return 400 for %s', async (_label, body, message) => {
      const response = await request(app).post('/api/wallets/1/exchanges').send(body);

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({ success: false, message });
    });

    it('should leave every balance untouched after a rejected request', async () => {
      await request(app)
        .post('/api/wallets/1/exchanges')
        .send({ fromCurrency: 'EUR', toCurrency: 'JPY', amount: '17362' });
      await request(app)
        .post('/api/wallets/1/exchanges')
        .send({ fromCurrency: 'JPY', toCurrency: 'GBP', amount: '1' });
      await request(app)
        .post('/api/wallets/1/exchanges')
        .send({ fromCurrency: 'CHF', toCurrency: 'JPY', amount: '5000' });

      expect(await balancesOf()).toEqual(SEEDED);
    });

    it('should return 400 for a malformed walletId', async () => {
      const response = await request(app)
        .post('/api/wallets/abc/exchanges')
        .send({ fromCurrency: 'EUR', toCurrency: 'JPY', amount: '5000' });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('walletId must be a positive integer');
    });

    it('should return 404 for a wallet that does not exist', async () => {
      const response = await request(app)
        .post('/api/wallets/9999/exchanges')
        .send({ fromCurrency: 'EUR', toCurrency: 'JPY', amount: '5000' });

      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ success: false, message: 'wallet not found' });
    });
  });

  describe('a successful exchange', () => {
    it('should return 201 with the created exchange and the rates frozen into it', async () => {
      // €50.00 at 1.08 USD/EUR into JPY at 0.0067 USD/JPY floors to ¥8059.
      const response = await request(app)
        .post('/api/wallets/1/exchanges')
        .send({ fromCurrency: 'EUR', toCurrency: 'JPY', amount: '5000' });

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          fromCurrency: 'EUR',
          toCurrency: 'JPY',
          fromAmount: '5000',
          toAmount: '8059',
          fromRateUsd: '1.0800000000',
          toRateUsd: '0.0067000000',
        }),
      );
      expect(Date.parse(response.body.createdAt)).not.toBeNaN();
    });

    it('should debit the source and credit the target by the floored amount', async () => {
      const before = await balancesOf();

      await request(app)
        .post('/api/wallets/1/exchanges')
        .send({ fromCurrency: 'EUR', toCurrency: 'JPY', amount: '5000' });

      const after = await balancesOf();

      expect(BigInt(after.EUR)).toBe(BigInt(before.EUR) - 5000n);
      expect(BigInt(after.JPY)).toBe(BigInt(before.JPY) + 8059n);
    });

    it('should record the exchange in the history', async () => {
      const created = await request(app)
        .post('/api/wallets/1/exchanges')
        .send({ fromCurrency: 'GBP', toCurrency: 'CNY', amount: '1000' });

      const history = await request(app).get('/api/wallets/1/exchanges');

      expect(history.statusCode).toBe(200);
      expect(history.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: created.body.id,
            fromCurrency: 'GBP',
            toCurrency: 'CNY',
          }),
        ]),
      );
    });

    it('should let the whole balance be spent down to zero', async () => {
      await request(app)
        .post('/api/wallets/1/exchanges')
        .send({ fromCurrency: 'USD', toCurrency: 'EUR', amount: SEEDED.USD });

      expect((await balancesOf()).USD).toBe('0');
    });
  });
});
