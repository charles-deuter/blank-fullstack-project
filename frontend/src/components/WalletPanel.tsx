import ExchangeDashboard from './ExchangeDashboard';
import { loadWallet } from '@/server-actions/wallet';

export default async function WalletPanel() {
  const result = await loadWallet();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-10">
      <h1 className="text-2xl font-semibold">Currency Exchange</h1>

      {result.ok ? (
        <ExchangeDashboard
          currencies={result.currencies}
          initialBalances={result.balances}
          initialTransactions={result.transactions}
        />
      ) : (
        <p className="rounded bg-danger/15 px-3 py-2 text-sm text-danger">
          {result.message}
        </p>
      )}
    </main>
  );
}
