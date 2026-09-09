import { findCurrency, formatMinorUnits } from '@/lib/currency';
import type { Balance, Currency } from '@/server-actions/wallet';

type WalletBalancesProps = {
  currencies: Currency[];
  balances: Balance[];
};

export default function WalletBalances({ currencies, balances }: WalletBalancesProps) {
  return (
    <div className="rounded-lg border border-edge bg-surface p-4 shadow-sm">
      <ul>
        {balances.map((balance) => {
          const currency = findCurrency(currencies, balance.currency);

          return (
            <li
              key={balance.currency}
              className="flex items-baseline justify-between border-b border-edge py-2.5 last:border-b-0"
            >
              <span className="text-sm font-medium text-muted">{balance.currency}</span>
              <span
                className={`tabular-nums ${balance.amount === 0 ? 'text-muted' : 'text-ink'}`}
              >
                {formatMinorUnits(balance.amount, currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
