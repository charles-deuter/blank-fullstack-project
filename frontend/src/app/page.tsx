import { getWalletBalances } from '@/server-actions/wallet';
import { getRates } from '@/server-actions/rates';
import { getExchangeHistory } from '@/server-actions/exchange';
import WalletPage from '@/components/WalletPage';

export default async function Home() {
  const [wallet, rates, history] = await Promise.all([
    getWalletBalances(),
    getRates(),
    getExchangeHistory(),
  ]);

  const failures = [
    wallet.ok ? null : wallet.message,
    rates.ok ? null : rates.message,
    history.ok ? null : history.message,
  ].filter((message): message is string => message !== null);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Currency Exchange</h1>

      {!wallet.ok || !rates.ok || !history.ok ? (
        <div role="alert" className="rounded bg-red-100 px-4 py-3 text-sm text-red-800">
          {failures.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : (
        <WalletPage
          initialBalances={wallet.balances}
          initialExchanges={history.exchanges}
          rates={rates.data.rates}
          currencies={rates.data.currencies}
        />
      )}
    </main>
  );
}
