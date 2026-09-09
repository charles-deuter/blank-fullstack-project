import {
  findCurrency,
  formatMinorUnits,
  formatRate,
  formatTimestamp,
} from '@/lib/currency';
import type { Currency, Transaction } from '@/server-actions/wallet';

type TransactionTableProps = {
  currencies: Currency[];
  transactions: Transaction[];
};

export default function TransactionTable({
  currencies,
  transactions,
}: TransactionTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-edge bg-surface p-4 shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-edge text-muted">
            <th className="py-2 pr-4 font-medium">Date (UTC)</th>
            <th className="py-2 pr-4 font-medium">From</th>
            <th className="py-2 pr-4 font-medium">To</th>
            <th className="py-2 font-medium">Rate</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-muted">
                No exchanges yet
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => {
              const from = findCurrency(currencies, transaction.from_currency);
              const to = findCurrency(currencies, transaction.to_currency);

              return (
                <tr key={transaction.id} className="border-b border-edge last:border-b-0">
                  <td className="py-2 pr-4 whitespace-nowrap text-muted">
                    {formatTimestamp(transaction.created_at)}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap tabular-nums">
                    {formatMinorUnits(transaction.from_amount, from)} {from.code}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap tabular-nums">
                    {formatMinorUnits(transaction.to_amount, to)} {to.code}
                  </td>
                  <td className="py-2 whitespace-nowrap tabular-nums text-muted">
                    {formatRate(from, to, transaction.rate)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
