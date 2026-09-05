'use server';

import { BACKEND_URL, failureMessage } from '@/lib/backend';

export type WalletBalance = {
  id: number;
  currency: string;
  amount: number;
};

export type GetWalletResult =
  { ok: true; balances: WalletBalance[] } | { ok: false; message: string };

export async function getWalletBalances(): Promise<GetWalletResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/wallet`, { cache: 'no-store' });

    if (!res.ok) {
      return { ok: false, message: `Failed to load wallet (HTTP ${res.status})` };
    }

    return { ok: true, balances: (await res.json()) as WalletBalance[] };
  } catch (err) {
    return { ok: false, message: `Failed to load wallet: ${failureMessage(err)}` };
  }
}
