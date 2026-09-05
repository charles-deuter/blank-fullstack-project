'use server';

import { BACKEND_URL, failureMessage } from '@/lib/backend';
import type { CurrencyMetaMap, RateMap } from '@/lib/currency';

export type RatesData = {
  rates: RateMap;
  currencies: CurrencyMetaMap;
};

export type GetRatesResult =
  { ok: true; data: RatesData } | { ok: false; message: string };

export async function getRates(): Promise<GetRatesResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/rates`, { cache: 'no-store' });

    if (!res.ok) {
      return { ok: false, message: `Failed to load rates (HTTP ${res.status})` };
    }

    return { ok: true, data: (await res.json()) as RatesData };
  } catch (err) {
    return { ok: false, message: `Failed to load rates: ${failureMessage(err)}` };
  }
}
