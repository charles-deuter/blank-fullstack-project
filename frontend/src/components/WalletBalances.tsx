import { CURRENCY_LABELS, formatAmount, formatUsd } from '@/lib/money';
import type { Balance } from '@/server-actions/wallet';

type WalletBalancesProps = {
  balances: Balance[];
  totalUsd: number;
};

export default function WalletBalances({ balances, totalUsd }: WalletBalancesProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-edge bg-surface p-4 shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-edge text-muted">
            <th className="py-2 pr-4 font-medium">Currency</th>
            <th className="py-2 pr-4 text-right font-medium">Balance</th>
            <th className="py-2 text-right font-medium">Value (USD)</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((balance) => (
            <tr key={balance.currency} className="border-b border-edge">
              <td className="py-2 pr-4">
                <span className="font-medium text-ink">{balance.currency}</span>
                <span className="ml-2 text-muted">
                  {CURRENCY_LABELS[balance.currency]}
                </span>
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatAmount(balance.amount, balance.currency)}
              </td>
              <td className="py-2 text-right tabular-nums text-muted">
                {formatUsd(balance.usdEquivalent)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-3 pr-4 font-medium text-ink" colSpan={2}>
              Total portfolio value
            </td>
            <td className="py-3 text-right font-medium tabular-nums text-ink">
              {formatUsd(totalUsd)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
