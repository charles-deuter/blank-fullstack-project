import request from 'supertest';
import app from '../src/app';

// The seeded balances, keyed by wallet id in insert order. Fixed literals are what
// make the reconciliation check below possible at all.
const SEED_BALANCE_CENTS: Record<number, number> = {
  1: 10000,
  2: 24350,
  3: 31200,
  4: 45000,
  5: 52725,
  6: 61800,
  7: 74500,
  8: 83300,
  9: 91050,
  10: 100000,
};

type Transaction = {
  id: number;
  sender_wallet_id: number;
  recipient_wallet_id: number;
  amount_cents: number;
};

async function send(sender: number, recipient: number, amount_cents: number) {
  const response = await request(app).post('/api/transactions').send({
    sender_wallet_id: sender,
    recipient_wallet_id: recipient,
    amount_cents,
  });

  return response.body as Transaction;
}

describe('GET /api/wallets/:id/transactions', () => {
  it('should include transfers where the wallet is the sender or the recipient', async () => {
    const received = await send(10, 9, 2500);
    const sent = await send(9, 8, 1000);
    const unrelated = await send(7, 6, 500);

    const response = await request(app).get('/api/wallets/9/transactions');
    const ids = response.body.map((transaction: Transaction) => transaction.id);

    expect(response.statusCode).toBe(200);
    expect(ids).toContain(received.id);
    expect(ids).toContain(sent.id);
    expect(ids).not.toContain(unrelated.id);
  });

  it('should return an empty history for an untouched wallet', async () => {
    const response = await request(app).get('/api/wallets/3/transactions');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should distinguish an unknown wallet from one with no history', async () => {
    const response = await request(app).get('/api/wallets/999999/transactions');

    expect(response.statusCode).toBe(404);
  });

  it('should order history newest first', async () => {
    await send(5, 4, 100);
    const newer = await send(5, 4, 200);

    const response = await request(app).get('/api/wallets/5/transactions');

    expect(response.body[0].id).toBe(newer.id);
  });
});

describe('ledger reconciliation', () => {
  it('should keep every balance equal to its seed plus credits minus debits', async () => {
    await send(10, 1, 3000);
    await send(1, 2, 500);
    await send(2, 10, 12000);

    const ledger = await request(app).get('/api/transactions');
    const wallets = await request(app).get('/api/wallets');

    for (const wallet of wallets.body) {
      const credits = ledger.body
        .filter((t: Transaction) => t.recipient_wallet_id === wallet.id)
        .reduce((sum: number, t: Transaction) => sum + t.amount_cents, 0);
      const debits = ledger.body
        .filter((t: Transaction) => t.sender_wallet_id === wallet.id)
        .reduce((sum: number, t: Transaction) => sum + t.amount_cents, 0);

      expect(wallet.balance_cents).toBe(SEED_BALANCE_CENTS[wallet.id] + credits - debits);
    }
  });

  it('should conserve the total money supply across all transfers', async () => {
    const seedTotal = Object.values(SEED_BALANCE_CENTS).reduce((a, b) => a + b, 0);

    const wallets = await request(app).get('/api/wallets');
    const total = wallets.body.reduce(
      (sum: number, wallet: { balance_cents: number }) => sum + wallet.balance_cents,
      0,
    );

    expect(total).toBe(seedTotal);
  });
});
