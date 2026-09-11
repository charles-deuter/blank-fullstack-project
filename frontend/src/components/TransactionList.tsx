import { formatAmount } from '@/lib/money';
import type { Transaction } from '@/server-actions/wallet';

// Locale and timezone are pinned so the server and the client format identically;
// letting either default would render different text and trip a hydration mismatch.
const createdAtFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

type TransactionListProps = {
  transactions: Transaction[];
};

export default function TransactionList({ transactions }: TransactionListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-edge bg-surface p-4 shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-edge text-muted">
            <th className="py-2 pr-4 font-medium">Date (UTC)</th>
            <th className="py-2 pr-4 text-right font-medium">Sold</th>
            <th className="py-2 pr-4 text-right font-medium">Bought</th>
            <th className="py-2 text-right font-medium">Rate</th>
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
            transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-edge">
                <td className="py-2 pr-4 tabular-nums text-muted">
                  {createdAtFormat.format(new Date(transaction.created_at))}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {formatAmount(transaction.from_amount, transaction.from_currency)}{' '}
                  <span className="text-muted">{transaction.from_currency}</span>
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {formatAmount(transaction.to_amount, transaction.to_currency)}{' '}
                  <span className="text-muted">{transaction.to_currency}</span>
                </td>
                <td className="py-2 text-right tabular-nums text-muted">
                  1 {transaction.from_currency} = {transaction.exchange_rate}{' '}
                  {transaction.to_currency}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
