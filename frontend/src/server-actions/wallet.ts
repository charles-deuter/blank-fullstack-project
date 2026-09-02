'use server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

export type Wallet = {
  id: number;
  display_name: string;
  /** Integer cents. $100.00 is 10000. */
  balance_cents: number;
  created_at: string;
};

export type Transaction = {
  id: number;
  sender_wallet_id: number;
  recipient_wallet_id: number;
  amount_cents: number;
  created_at: string;
};

/** Everything the payments screen renders, read in one pass. */
export type PaymentsSnapshot = {
  sender: Wallet;
  wallets: Wallet[];
  transactions: Transaction[];
};

export type LoadPaymentsSnapshotResult =
  { ok: true; snapshot: PaymentsSnapshot } | { ok: false; message: string };

function failureMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isWalletId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

// The three reads below are intentionally NOT exported. Every export of a 'use server'
// module is a public POST endpoint, so the module exposes only the one call the UI
// actually makes.

async function getWallet(id: number): Promise<Wallet> {
  const res = await fetch(`${BACKEND_URL}/api/wallets/${id}`, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Failed to load wallet ${id} (HTTP ${res.status})`);
  }

  return (await res.json()) as Wallet;
}

async function listWallets(): Promise<Wallet[]> {
  const res = await fetch(`${BACKEND_URL}/api/wallets`, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Failed to load wallets (HTTP ${res.status})`);
  }

  return (await res.json()) as Wallet[];
}

async function listWalletTransactions(id: number): Promise<Transaction[]> {
  const res = await fetch(`${BACKEND_URL}/api/wallets/${id}/transactions`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to load transactions for wallet ${id} (HTTP ${res.status})`);
  }

  return (await res.json()) as Transaction[];
}

/**
 * Read the sender, the wallet directory and the sender's history together.
 *
 * One action rather than three, because the client dispatches Server Functions one at
 * a time — three calls from the browser would be three sequential roundtrips, while
 * the Promise.all inside this one runs on the server in parallel.
 */
export async function loadPaymentsSnapshot(
  walletId: unknown,
): Promise<LoadPaymentsSnapshotResult> {
  // Reachable by direct POST, not just from our own form, so the id is validated
  // rather than trusted into a URL.
  if (!isWalletId(walletId)) {
    return { ok: false, message: 'A wallet id must be a positive integer' };
  }

  try {
    const [sender, wallets, transactions] = await Promise.all([
      getWallet(walletId),
      listWallets(),
      listWalletTransactions(walletId),
    ]);

    return { ok: true, snapshot: { sender, wallets, transactions } };
  } catch (err) {
    return { ok: false, message: `Failed to load wallets: ${failureMessage(err)}` };
  }
}
