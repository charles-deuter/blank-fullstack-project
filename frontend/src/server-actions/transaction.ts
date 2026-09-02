'use server';

import type { Transaction } from './wallet';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

export type SendTransferResult =
  { ok: true; transaction: Transaction } | { ok: false; message: string };

// Untyped and validated at runtime, per CLAUDE.md: this is a request body from an
// untrusted caller, not a checked call from our own component. `unknown` rather than
// `any` because the lint config forbids `any`, and it forces the checks below anyway.
export type SendTransferInput = {
  senderWalletId: unknown;
  recipientWalletId: unknown;
  amountCents: unknown;
};

function failureMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Move money between two wallets.
 *
 * The backend owns the transfer rules — self-transfer, unknown wallet, insufficient
 * funds — and records every rejection in `transaction_errors`. So this only screens
 * out input that could not form a well-formed request at all, and forwards the rest
 * for the backend to judge and log. Rejecting a business case here instead would
 * silently drop it from that audit trail.
 */
export async function sendTransfer(
  input: Partial<SendTransferInput> | null,
): Promise<SendTransferResult> {
  const { senderWalletId, recipientWalletId, amountCents } = input ?? {};

  if (
    !isFiniteNumber(senderWalletId) ||
    !isFiniteNumber(recipientWalletId) ||
    !isFiniteNumber(amountCents)
  ) {
    return { ok: false, message: 'Wallet ids and amount must be numbers' };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_wallet_id: senderWalletId,
        recipient_wallet_id: recipientWalletId,
        amount_cents: amountCents,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      // The backend sends { message } on every rejection; fall back to the status.
      const body = await res.json().catch(() => null);
      return {
        ok: false,
        message: body?.message ?? `Transfer failed (HTTP ${res.status})`,
      };
    }

    return { ok: true, transaction: (await res.json()) as Transaction };
  } catch (err) {
    return { ok: false, message: `Transfer failed: ${failureMessage(err)}` };
  }
}
