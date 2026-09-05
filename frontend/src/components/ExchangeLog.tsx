import type { ExchangeRecord } from '@/server-actions/exchange';
import { formatSmallestUnit, type CurrencyMetaMap } from '@/lib/currency';

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

const COLUMNS = ['ID', 'From', 'To', 'Sent', 'Received', 'Rate', 'Date (UTC)'];

type ExchangeLogProps = {
  exchanges: ExchangeRecord[];
  currencies: CurrencyMetaMap;
};

function formatAmount(
  amount: number,
  currency: string,
  currencies: CurrencyMetaMap,
): string {
  const meta = currencies[currency];
  return meta ? formatSmallestUnit(amount, currency, meta) : String(amount);
}

export default function ExchangeLog({ exchanges, currencies }: ExchangeLogProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Exchange History</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-gray-500">
              {COLUMNS.map((column) => (
                <th key={column} scope="col" className="py-2 pr-4 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exchanges.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="py-4 text-gray-500">
                  No exchanges yet
                </td>
              </tr>
            ) : (
              exchanges.map((exchange) => (
                <tr key={exchange.id} className="border-b border-gray-200">
                  <td className="py-2 pr-4">{exchange.id}</td>
                  <td className="py-2 pr-4">{exchange.from_currency}</td>
                  <td className="py-2 pr-4">{exchange.to_currency}</td>
                  <td className="py-2 pr-4 font-mono">
                    {formatAmount(
                      exchange.from_amount,
                      exchange.from_currency,
                      currencies,
                    )}
                  </td>
                  <td className="py-2 pr-4 font-mono">
                    {formatAmount(exchange.to_amount, exchange.to_currency, currencies)}
                  </td>
                  <td className="py-2 pr-4 font-mono">{exchange.rate_used}</td>
                  <td className="py-2">
                    {createdAtFormat.format(new Date(exchange.created_at))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
