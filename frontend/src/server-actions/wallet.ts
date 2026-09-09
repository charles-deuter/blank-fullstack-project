'use server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

// The app seeds and displays exactly one wallet; the id stays server-side so the
// client never has to know or send it.
const WALLET_ID = 1;

export type Currency = {
  code: string;
  /** How many units of this currency one USD buys. */
  rate: number;
  /** Decimal places in this currency's minor unit. */
  decimals: number;
};

export type Balance = {
  id: number;
  wallet_id: number;
  currency: string;
  /** Stored in the currency's minor unit. */
  amount: number;
};

export type Transaction = {
  id: number;
  wallet_id: number;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  rate: number;
  created_at: string;
};

export type WalletSnapshot = {
  currencies: Currency[];
  balances: Balance[];
  transactions: Transaction[];
};

export type LoadWalletResult =
  ({ ok: true } & WalletSnapshot) | { ok: false; message: string };

export type ExchangeResult =
  | { ok: true; transaction: Transaction; balances: Balance[] }
  | { ok: false; message: string };

function failureMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}

export async function loadWallet(): Promise<LoadWalletResult> {
  try {
    const [rates, balances, transactions] = await Promise.all([
      getJson<{ base: string; currencies: Currency[] }>('/api/rates'),
      getJson<Balance[]>(`/api/wallets/${WALLET_ID}/balances`),
      getJson<Transaction[]>(`/api/wallets/${WALLET_ID}/transactions`),
    ]);

    return { ok: true, currencies: rates.currencies, balances, transactions };
  } catch (err) {
    return { ok: false, message: `Failed to load wallet: ${failureMessage(err)}` };
  }
}

export async function createExchange(
  fromCurrency: string,
  toCurrency: string,
  fromAmount: number,
): Promise<ExchangeResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/wallets/${WALLET_ID}/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: fromAmount,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      // The backend sends { message } on a 400; fall back to the status if it didn't.
      const body = await res.json().catch(() => null);
      return {
        ok: false,
        message: body?.message ?? `Exchange failed (HTTP ${res.status})`,
      };
    }

    const transaction = (await res.json()) as Transaction;
    // Next.js dispatches Server Actions one at a time, so re-reading balances here
    // keeps the whole update to a single client round trip.
    const balances = await getJson<Balance[]>(`/api/wallets/${WALLET_ID}/balances`);

    return { ok: true, transaction, balances };
  } catch (err) {
    return { ok: false, message: `Exchange failed: ${failureMessage(err)}` };
  }
}
