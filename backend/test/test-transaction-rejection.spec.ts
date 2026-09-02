import request from 'supertest';
import app from '../src/app';
import * as transactionErrorDal from '../src/database/dal/transaction-error';

// No route exposes transaction_errors, so the log is asserted through the DAL.
async function latestError() {
  const [newest] = await transactionErrorDal.findAll();

  return newest;
}

async function balanceOf(walletId: number): Promise<number> {
  const response = await request(app).get(`/api/wallets/${walletId}`);

  return response.body.balance_cents;
}

describe('POST /api/transactions rejections', () => {
  // Wallet 1 (Ada Lovelace) is seeded at exactly $100.00, the lower bound, which is
  // what makes it a reliable overdraft subject.
  it.each([
    [
      'INVALID_AMOUNT',
      400,
      { sender_wallet_id: 10, recipient_wallet_id: 9, amount_cents: 0 },
    ],
    [
      'INVALID_AMOUNT',
      400,
      { sender_wallet_id: 10, recipient_wallet_id: 9, amount_cents: -500 },
    ],
    [
      'INVALID_AMOUNT',
      400,
      { sender_wallet_id: 10, recipient_wallet_id: 9, amount_cents: 12.5 },
    ],
    [
      'INVALID_AMOUNT',
      400,
      { sender_wallet_id: 10, recipient_wallet_id: 9, amount_cents: '500' },
    ],
    ['INVALID_AMOUNT', 400, { sender_wallet_id: 10, recipient_wallet_id: 9 }],
    [
      'SELF_TRANSFER',
      400,
      { sender_wallet_id: 4, recipient_wallet_id: 4, amount_cents: 100 },
    ],
    [
      'SENDER_NOT_FOUND',
      404,
      { sender_wallet_id: 999999, recipient_wallet_id: 9, amount_cents: 100 },
    ],
    [
      'SENDER_NOT_FOUND',
      404,
      { sender_wallet_id: 'nope', recipient_wallet_id: 9, amount_cents: 100 },
    ],
    [
      'RECIPIENT_NOT_FOUND',
      404,
      { sender_wallet_id: 10, recipient_wallet_id: 999999, amount_cents: 100 },
    ],
    [
      'INSUFFICIENT_FUNDS',
      422,
      { sender_wallet_id: 1, recipient_wallet_id: 2, amount_cents: 50000000 },
    ],
  ])('should reject with %s and status %i', async (reason, status, body) => {
    const response = await request(app).post('/api/transactions').send(body);

    expect(response.statusCode).toBe(status);
    expect(response.body.message).toEqual(expect.any(String));
    expect(await latestError()).toEqual(expect.objectContaining({ reason }));
  });

  it('should not move any money when a transfer is rejected', async () => {
    const senderBefore = await balanceOf(1);
    const recipientBefore = await balanceOf(2);

    const response = await request(app).post('/api/transactions').send({
      sender_wallet_id: 1,
      recipient_wallet_id: 2,
      amount_cents: 50000000,
    });

    expect(response.statusCode).toBe(422);
    expect(await balanceOf(1)).toBe(senderBefore);
    expect(await balanceOf(2)).toBe(recipientBefore);
  });

  it('should not record a ledger row when a transfer is rejected', async () => {
    const before = await request(app).get('/api/transactions');

    await request(app).post('/api/transactions').send({
      sender_wallet_id: 1,
      recipient_wallet_id: 2,
      amount_cents: 50000000,
    });

    const after = await request(app).get('/api/transactions');

    expect(after.body).toHaveLength(before.body.length);
  });

  it('should log the attempted amount and wallets alongside the reason', async () => {
    await request(app).post('/api/transactions').send({
      sender_wallet_id: 1,
      recipient_wallet_id: 3,
      amount_cents: 40000000,
    });

    expect(await latestError()).toEqual(
      expect.objectContaining({
        sender_wallet_id: 1,
        recipient_wallet_id: 3,
        amount_cents: 40000000,
        reason: 'INSUFFICIENT_FUNDS',
      }),
    );
  });

  it('should log a wallet id that never existed, since the log has no foreign keys', async () => {
    await request(app).post('/api/transactions').send({
      sender_wallet_id: 10,
      recipient_wallet_id: 999999,
      amount_cents: 100,
    });

    expect(await latestError()).toEqual(
      expect.objectContaining({
        recipient_wallet_id: 999999,
        reason: 'RECIPIENT_NOT_FOUND',
      }),
    );
  });

  it('should not expose the error log over HTTP', async () => {
    const response = await request(app).get('/api/transaction-errors');

    expect(response.statusCode).toBe(404);
  });
});
