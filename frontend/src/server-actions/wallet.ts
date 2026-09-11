'use server';

import { refresh } from 'next/cache';
import type { Currency } from '@/lib/money';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

export type Balance = {
  currency: Currency;
  amount: number;
  decimals: number;
  usdEquivalent: number;
};

export type Wallet = {
  id: number;
  balances: Balance[];
  totalUsd: number;
};

export type Transaction = {
  id: number;
  wallet_id: number;
  from_currency: Currency;
  to_currency: Currency;
  from_amount: number;
  to_amount: number;
  exchange_rate: string;
  created_at: string;
};

export type ExchangePreview = {
  fromAmount: number;
  toAmount: number;
  rate: string;
};

export type GetWalletResult =
  { ok: true; wallet: Wallet } | { ok: false; message: string };

export type GetTransactionsResult =
  { ok: true; transactions: Transaction[] } | { ok: false; message: string };

export type PreviewResult =
  { ok: true; preview: ExchangePreview } | { ok: false; message: string };

export type CreateExchangeResult =
  { ok: true; transaction: Transaction } | { ok: false; message: string };

function failureMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// The backend sends { message } on a 4xx; fall back to the status if it didn't.
async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);

  return body?.message ?? `${fallback} (HTTP ${res.status})`;
}

export async function getWallet(walletId: number): Promise<GetWalletResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/wallets/${walletId}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return { ok: false, message: await errorMessage(res, 'Failed to load wallet') };
    }

    return { ok: true, wallet: (await res.json()) as Wallet };
  } catch (err) {
    return { ok: false, message: `Failed to load wallet: ${failureMessage(err)}` };
  }
}

export async function getTransactions(walletId: number): Promise<GetTransactionsResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/wallets/${walletId}/transactions`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        ok: false,
        message: await errorMessage(res, 'Failed to load transactions'),
      };
    }

    return { ok: true, transactions: (await res.json()) as Transaction[] };
  } catch (err) {
    return { ok: false, message: `Failed to load transactions: ${failureMessage(err)}` };
  }
}

export async function previewExchange(
  from: Currency,
  to: Currency,
  amount: number,
): Promise<PreviewResult> {
  try {
    const query = new URLSearchParams({ from, to, amount: String(amount) });
    const res = await fetch(`${BACKEND_URL}/api/exchange-rate?${query}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return { ok: false, message: await errorMessage(res, 'Failed to price exchange') };
    }

    return { ok: true, preview: (await res.json()) as ExchangePreview };
  } catch (err) {
    return { ok: false, message: `Failed to price exchange: ${failureMessage(err)}` };
  }
}

export async function createExchange(
  walletId: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  fromAmount: number,
): Promise<CreateExchangeResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/wallets/${walletId}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromCurrency, toCurrency, fromAmount }),
      cache: 'no-store',
    });

    if (!res.ok) {
      return { ok: false, message: await errorMessage(res, 'Exchange failed') };
    }

    // Re-renders the server components in this same response, so the balances
    // and the transaction list both reflect the exchange without a second trip.
    refresh();

    return { ok: true, transaction: (await res.json()) as Transaction };
  } catch (err) {
    return { ok: false, message: `Exchange failed: ${failureMessage(err)}` };
  }
}
