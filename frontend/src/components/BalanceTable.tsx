'use client';

import { useState, useTransition } from 'react';
import { formatMinor, formatUsd } from '@/lib/money';
import {
  createExchange,
  getWallet,
  listExchanges,
  type Exchange,
  type Wallet,
} from '@/server-actions/wallet';
import ExchangeDialog, { type ExchangeRequest } from './ExchangeDialog';
import ExchangeHistoryTable from './ExchangeHistoryTable';

type Status = { ok: boolean; message: string };

type BalanceTableProps = {
  walletId: number;
  initialWallet: Wallet | null;
  initialExchanges: Exchange[];
  initialError: string | null;
};

export default function BalanceTable({
  walletId,
  initialWallet,
  initialExchanges,
  initialError,
}: BalanceTableProps) {
  const [wallet, setWallet] = useState<Wallet | null>(initialWallet);
  const [exchanges, setExchanges] = useState<Exchange[]>(initialExchanges);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(
    initialError ? { ok: false, message: initialError } : null,
  );
  const [isPending, startTransition] = useTransition();

  const exponents = Object.fromEntries(
    (wallet?.balances ?? []).map((balance) => [balance.currency, balance.exponent]),
  );

  function handleExchange(request: ExchangeRequest) {
    startTransition(async () => {
      const created = await createExchange(
        walletId,
        request.fromCurrency,
        request.toCurrency,
        request.amount,
      );

      if (!created.ok) {
        setStatus({ ok: false, message: created.message });
        return;
      }

      // Re-read rather than updating locally: the output amount is floored on
      // the server, and predicting it here would mean a second copy of the rate
      // math that is free to drift from the first.
      const [reread, history] = await Promise.all([
        getWallet(walletId),
        listExchanges(walletId),
      ]);

      if (!reread.ok) {
        setStatus({ ok: false, message: reread.message });
        return;
      }

      if (!history.ok) {
        setStatus({ ok: false, message: history.message });
        return;
      }

      setWallet(reread.wallet);
      setExchanges(history.exchanges);
      setIsDialogOpen(false);
      setStatus({
        ok: true,
        message: `Exchanged ${request.fromCurrency} for ${request.toCurrency}`,
      });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          disabled={isPending || wallet === null}
          className="self-start rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Exchange
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
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-gray-500">
              <th className="py-2 pr-4 font-medium">currency</th>
              <th className="py-2 pr-4 text-right font-medium">balance</th>
              <th className="py-2 text-right font-medium">USD value</th>
            </tr>
          </thead>
          <tbody>
            {wallet === null ? (
              <tr>
                <td colSpan={3} className="py-4 text-gray-500">
                  No wallet loaded
                </td>
              </tr>
            ) : (
              wallet.balances.map((balance) => (
                <tr key={balance.currency} className="border-b border-gray-200">
                  <td className="py-2 pr-4">{balance.currency}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {formatMinor(balance.amount, balance.exponent)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatUsd(balance.usdValue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {wallet !== null && (
            <tfoot>
              <tr className="font-medium">
                <td className="py-2 pr-4" colSpan={2}>
                  Total
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatUsd(wallet.totalUsd)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <ExchangeHistoryTable exchanges={exchanges} exponents={exponents} />

      {isDialogOpen && wallet !== null && (
        <ExchangeDialog
          balances={wallet.balances}
          isPending={isPending}
          onSubmit={handleExchange}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}
