import { formatMinor } from '@/lib/money';
import type { Exchange } from '@/server-actions/wallet';

// Locale and timezone are pinned so the server and the client format
// identically; letting either default would trip a hydration mismatch.
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

type ExchangeHistoryTableProps = {
  exchanges: Exchange[];
  // Exponents come from the wallet response rather than a second copy of the
  // currency table here.
  exponents: Record<string, number>;
};

export default function ExchangeHistoryTable({
  exchanges,
  exponents,
}: ExchangeHistoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="pb-2 text-sm font-semibold">Exchange history</h3>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-gray-500">
            <th className="py-2 pr-4 font-medium">from</th>
            <th className="py-2 pr-4 font-medium">to</th>
            <th className="py-2 font-medium">at (UTC)</th>
          </tr>
        </thead>
        <tbody>
          {exchanges.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 text-gray-500">
                No exchanges yet
              </td>
            </tr>
          ) : (
            exchanges.map((exchange) => (
              <tr key={exchange.id} className="border-b border-gray-200">
                <td className="py-2 pr-4 tabular-nums">
                  {formatMinor(
                    exchange.fromAmount,
                    exponents[exchange.fromCurrency] ?? 0,
                  )}{' '}
                  {exchange.fromCurrency}
                </td>
                <td className="py-2 pr-4 tabular-nums">
                  {formatMinor(exchange.toAmount, exponents[exchange.toCurrency] ?? 0)}{' '}
                  {exchange.toCurrency}
                </td>
                <td className="py-2">
                  {createdAtFormat.format(new Date(exchange.createdAt))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
