'use client';

import { useMemo, useState, useTransition } from 'react';
import { formatCents, parseDollarsToCents } from '@/lib/money';
import { sendTransfer } from '@/server-actions/transaction';
import {
  loadPaymentsSnapshot,
  type PaymentsSnapshot,
  type Wallet,
} from '@/server-actions/wallet';
import TransactionHistory from './TransactionHistory';

type Status = { ok: boolean; message: string };

type PaymentsDashboardProps = {
  initialSnapshot: PaymentsSnapshot;
};

function byIdAscending(a: Wallet, b: Wallet) {
  return a.id - b.id;
}

export default function PaymentsDashboard({ initialSnapshot }: PaymentsDashboardProps) {
  const [snapshot, setSnapshot] = useState<PaymentsSnapshot>(initialSnapshot);
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [isPending, startTransition] = useTransition();

  const { sender, wallets, transactions } = snapshot;

  // The API orders wallets newest-first; the picker reads better oldest-first, and
  // you cannot pay yourself, so the sender is not an option.
  const recipients = useMemo(
    () => wallets.filter((wallet) => wallet.id !== sender.id).sort(byIdAscending),
    [wallets, sender.id],
  );

  const walletNamesById = useMemo(
    () =>
      Object.fromEntries(
        wallets.map((wallet) => [wallet.id, wallet.display_name]),
      ) as Record<number, string>,
    [wallets],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amountCents = parseDollarsToCents(amount);

    if (amountCents === null) {
      setStatus({ ok: false, message: 'Enter an amount greater than zero, like 25.00' });
      return;
    }

    if (recipientId === '') {
      setStatus({ ok: false, message: 'Choose someone to pay' });
      return;
    }

    startTransition(async () => {
      const sent = await sendTransfer({
        senderWalletId: sender.id,
        recipientWalletId: Number(recipientId),
        amountCents,
      });

      if (!sent.ok) {
        setStatus({ ok: false, message: sent.message });
        return;
      }

      // Re-read rather than adjusting balances locally, so the server stays the single
      // source of truth for both the balance and the ordering of the history.
      const reloaded = await loadPaymentsSnapshot(sender.id);

      if (!reloaded.ok) {
        setStatus({ ok: false, message: reloaded.message });
        return;
      }

      const recipientName =
        walletNamesById[Number(recipientId)] ?? `wallet #${recipientId}`;

      setSnapshot(reloaded.snapshot);
      setAmount('');
      setStatus({
        ok: true,
        message: `Sent ${formatCents(amountCents)} to ${recipientName}`,
      });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <span className="text-sm text-gray-500">Paying as {sender.display_name}</span>
        <span className="text-3xl font-semibold tabular-nums">
          {formatCents(sender.balance_cents)}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Pay</span>
          <select
            value={recipientId}
            onChange={(event) => setRecipientId(event.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Select a wallet…</option>
            {recipients.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.display_name} ({formatCents(wallet.balance_cents)})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Amount</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">$</span>
            <input
              // `text`, not `number`: a number input lets the browser hand back
              // locale-formatted or exponent values that are not cent amounts.
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="25.00"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Sending…' : 'Send'}
        </button>

        <div role="status" aria-live="polite" className="min-h-9">
          {status && (
            <p
              className={`rounded px-3 py-2 text-sm ${
                status.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {status.message}
            </p>
          )}
        </div>
      </form>

      <h3 className="text-sm font-medium text-gray-500">Activity</h3>
      <TransactionHistory
        transactions={transactions}
        walletId={sender.id}
        walletNamesById={walletNamesById}
      />
    </div>
  );
}
