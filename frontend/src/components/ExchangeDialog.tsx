'use client';

import { useState } from 'react';
import { parseMajorToMinor } from '@/lib/money';
import type { Balance } from '@/server-actions/wallet';

export type ExchangeRequest = {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
};

type ExchangeDialogProps = {
  balances: Balance[];
  isPending: boolean;
  onSubmit: (request: ExchangeRequest) => void;
  onClose: () => void;
};

export default function ExchangeDialog({
  balances,
  isPending,
  onSubmit,
  onClose,
}: ExchangeDialogProps) {
  const [fromCurrency, setFromCurrency] = useState(balances[0]?.currency ?? '');
  const [toCurrency, setToCurrency] = useState(balances[1]?.currency ?? '');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const exponent = balances.find((b) => b.currency === fromCurrency)?.exponent ?? 0;
  // Nothing is exchanged for itself, so the target list never offers the source.
  const targets = balances.filter((b) => b.currency !== fromCurrency);

  function handleFromChange(currency: string) {
    setFromCurrency(currency);

    if (currency === toCurrency) {
      setToCurrency(balances.find((b) => b.currency !== currency)?.currency ?? '');
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const minor = parseMajorToMinor(amount, exponent);

    if (minor === null) {
      setError(
        exponent === 0
          ? 'Enter a whole amount greater than zero'
          : `Enter an amount greater than zero, with at most ${exponent} decimal places`,
      );
      return;
    }

    setError(null);
    onSubmit({ fromCurrency, toCurrency, amount: minor });
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-6 shadow-lg"
      >
        <h3 className="text-base font-semibold">Exchange</h3>

        <label className="flex flex-col gap-1 text-sm">
          From
          <select
            value={fromCurrency}
            onChange={(event) => handleFromChange(event.target.value)}
            className="rounded border border-gray-300 px-2 py-1"
          >
            {balances.map((balance) => (
              <option key={balance.currency} value={balance.currency}>
                {balance.currency}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          To
          <select
            value={toCurrency}
            onChange={(event) => setToCurrency(event.target.value)}
            className="rounded border border-gray-300 px-2 py-1"
          >
            {targets.map((balance) => (
              <option key={balance.currency} value={balance.currency}>
                {balance.currency}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Amount ({fromCurrency})
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder={exponent === 0 ? '100' : '100.00'}
            className="rounded border border-gray-300 px-2 py-1"
          />
        </label>

        {error && (
          <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Exchanging…' : 'Exchange'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
