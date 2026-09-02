import { formatCents } from '@/lib/money';
import type { Transaction } from '@/server-actions/wallet';

// Locale and timezone are pinned so the server and the client format identically;
// letting either default would render different text and trip a hydration mismatch.
const createdAtFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

type TransactionHistoryProps = {
  transactions: Transaction[];
  /** Whose history this is; decides which side of each transfer is "the other one". */
  walletId: number;
  walletNamesById: Record<number, string>;
};

export default function TransactionHistory({
  transactions,
  walletId,
  walletNamesById,
}: TransactionHistoryProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-gray-500">
            <th className="py-2 pr-4 font-medium">When (UTC)</th>
            <th className="py-2 pr-4 font-medium">Counterparty</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 text-gray-500">
                No transactions yet
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => {
              // The history endpoint returns transfers this wallet was on either side
              // of, so direction is derived per row rather than assumed.
              const isOutgoing = transaction.sender_wallet_id === walletId;
              const counterpartyId = isOutgoing
                ? transaction.recipient_wallet_id
                : transaction.sender_wallet_id;

              return (
                <tr key={transaction.id} className="border-b border-gray-200">
                  <td className="py-2 pr-4 whitespace-nowrap text-gray-600">
                    {createdAtFormat.format(new Date(transaction.created_at))}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="text-gray-500">{isOutgoing ? 'To' : 'From'}</span>{' '}
                    {walletNamesById[counterpartyId] ?? `wallet #${counterpartyId}`}
                  </td>
                  <td
                    className={`py-2 text-right font-medium whitespace-nowrap ${
                      isOutgoing ? 'text-red-700' : 'text-green-700'
                    }`}
                  >
                    {isOutgoing ? '−' : '+'}
                    {formatCents(transaction.amount_cents)}
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
