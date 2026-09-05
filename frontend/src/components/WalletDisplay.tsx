import type { WalletBalance } from '@/server-actions/wallet';
import { formatSmallestUnit, type CurrencyMetaMap } from '@/lib/currency';

type WalletDisplayProps = {
  balances: WalletBalance[];
  currencies: CurrencyMetaMap;
};

export default function WalletDisplay({ balances, currencies }: WalletDisplayProps) {
  // The DAL sorts alphabetically for a deterministic response; display follows the
  // canonical currency order instead, which puts the funded USD balance first.
  const order = Object.keys(currencies);
  const ordered = [...balances].sort(
    (a, b) => order.indexOf(a.currency) - order.indexOf(b.currency),
  );

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Wallet</h2>
      <dl className="flex flex-col gap-2">
        {ordered.map((balance) => {
          const meta = currencies[balance.currency];
          if (!meta) return null;

          return (
            <div
              key={balance.currency}
              className="flex items-center justify-between rounded bg-gray-50 px-3 py-2"
            >
              <dt className="font-medium text-gray-700">{balance.currency}</dt>
              <dd className="font-mono text-gray-900">
                {formatSmallestUnit(balance.amount, balance.currency, meta)}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
