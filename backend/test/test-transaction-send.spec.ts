import request from 'supertest';
import app from '../src/app';

// Balances are read before and after each transfer rather than compared against the
// seed: tests in this file share one database, so earlier transfers have already
// moved money by the time later ones run.
async function balanceOf(walletId: number): Promise<number> {
  const response = await request(app).get(`/api/wallets/${walletId}`);

  return response.body.balance_cents;
}

describe('POST /api/transactions', () => {
  it('should return 201 and the created transaction', async () => {
    const response = await request(app).post('/api/transactions').send({
      sender_wallet_id: 10,
      recipient_wallet_id: 1,
      amount_cents: 2500,
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        sender_wallet_id: 10,
        recipient_wallet_id: 1,
        amount_cents: 2500,
      }),
    );
    expect(Date.parse(response.body.created_at)).not.toBeNaN();
  });

  it('should debit the sender and credit the recipient by exactly the amount', async () => {
    const senderBefore = await balanceOf(9);
    const recipientBefore = await balanceOf(8);

    await request(app).post('/api/transactions').send({
      sender_wallet_id: 9,
      recipient_wallet_id: 8,
      amount_cents: 1234,
    });

    expect(await balanceOf(9)).toBe(senderBefore - 1234);
    expect(await balanceOf(8)).toBe(recipientBefore + 1234);
  });

  it('should conserve money across the transfer', async () => {
    const senderBefore = await balanceOf(7);
    const recipientBefore = await balanceOf(6);

    await request(app).post('/api/transactions').send({
      sender_wallet_id: 7,
      recipient_wallet_id: 6,
      amount_cents: 5000,
    });

    const total = (await balanceOf(7)) + (await balanceOf(6));

    expect(total).toBe(senderBefore + recipientBefore);
  });

  it('should persist the transaction so it is returned by GET', async () => {
    const created = await request(app).post('/api/transactions').send({
      sender_wallet_id: 5,
      recipient_wallet_id: 4,
      amount_cents: 777,
    });

    const response = await request(app).get('/api/transactions');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.id, amount_cents: 777 }),
      ]),
    );
  });

  it('should return the most recent transaction first', async () => {
    await request(app)
      .post('/api/transactions')
      .send({ sender_wallet_id: 3, recipient_wallet_id: 2, amount_cents: 100 });
    const newer = await request(app)
      .post('/api/transactions')
      .send({ sender_wallet_id: 3, recipient_wallet_id: 2, amount_cents: 200 });

    const response = await request(app).get('/api/transactions');

    expect(response.body[0].id).toBe(newer.body.id);
  });

  it('should allow a transfer that spends the entire balance', async () => {
    const senderBefore = await balanceOf(2);

    const response = await request(app).post('/api/transactions').send({
      sender_wallet_id: 2,
      recipient_wallet_id: 1,
      amount_cents: senderBefore,
    });

    expect(response.statusCode).toBe(201);
    expect(await balanceOf(2)).toBe(0);
  });
});
