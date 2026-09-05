'use server';

import { BACKEND_URL, errorMessage, failureMessage } from '@/lib/backend';

export type ExchangeRecord = {
  id: number;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  rate_used: string;
  created_at: string;
};

export type GetExchangeHistoryResult =
  { ok: true; exchanges: ExchangeRecord[] } | { ok: false; message: string };

export type PerformExchangeResult =
  { ok: true; exchange: ExchangeRecord } | { ok: false; message: string };

export async function getExchangeHistory(): Promise<GetExchangeHistoryResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/exchanges`, { cache: 'no-store' });

    if (!res.ok) {
      return {
        ok: false,
        message: `Failed to load exchange history (HTTP ${res.status})`,
      };
    }

    return { ok: true, exchanges: (await res.json()) as ExchangeRecord[] };
  } catch (err) {
    return {
      ok: false,
      message: `Failed to load exchange history: ${failureMessage(err)}`,
    };
  }
}

export async function performExchange(
  fromCurrency: string,
  toCurrency: string,
  amount: number,
): Promise<PerformExchangeResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/exchanges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      return { ok: false, message: await errorMessage(res, 'Exchange failed') };
    }

    return { ok: true, exchange: (await res.json()) as ExchangeRecord };
  } catch (err) {
    return { ok: false, message: `Exchange failed: ${failureMessage(err)}` };
  }
}
