'use server';

// Every export from a 'use server' module is a public endpoint, so nothing but
// the actions themselves is exported here. Types are erased at compile time.

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

export type Balance = {
  currency: string;
  amount: string;
  exponent: number;
  usdValue: string;
};

export type Wallet = {
  id: number;
  name: string;
  balances: Balance[];
  totalUsd: string;
  rates: Record<string, string>;
};

export type Exchange = {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  toAmount: string;
  fromRateUsd: string;
  toRateUsd: string;
  createdAt: string;
};

export type GetWalletResult =
  { ok: true; wallet: Wallet } | { ok: false; message: string };

export type ListExchangesResult =
  { ok: true; exchanges: Exchange[] } | { ok: false; message: string };

export type CreateExchangeResult =
  { ok: true; exchange: Exchange } | { ok: false; message: string };

function failureMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function getWallet(walletId: number): Promise<GetWalletResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/wallets/${walletId}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return {
        ok: false,
        message: body?.message ?? `Failed to load the wallet (HTTP ${res.status})`,
      };
    }

    return { ok: true, wallet: (await res.json()) as Wallet };
  } catch (err) {
    return { ok: false, message: `Failed to load the wallet: ${failureMessage(err)}` };
  }
}

export async function listExchanges(walletId: number): Promise<ListExchangesResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/wallets/${walletId}/exchanges`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return {
        ok: false,
        message:
          body?.message ?? `Failed to load the exchange history (HTTP ${res.status})`,
      };
    }

    return { ok: true, exchanges: (await res.json()) as Exchange[] };
  } catch (err) {
    return {
      ok: false,
      message: `Failed to load the exchange history: ${failureMessage(err)}`,
    };
  }
}

export async function createExchange(
  walletId: number,
  fromCurrency: string,
  toCurrency: string,
  amount: string,
): Promise<CreateExchangeResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/wallets/${walletId}/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromCurrency, toCurrency, amount }),
      cache: 'no-store',
    });

    if (!res.ok) {
      // The backend sends { success, message } on a 400; fall back to the
      // status if it didn't.
      const body = await res.json().catch(() => null);
      return {
        ok: false,
        message: body?.message ?? `Exchange failed (HTTP ${res.status})`,
      };
    }

    return { ok: true, exchange: (await res.json()) as Exchange };
  } catch (err) {
    return { ok: false, message: `Exchange failed: ${failureMessage(err)}` };
  }
}
