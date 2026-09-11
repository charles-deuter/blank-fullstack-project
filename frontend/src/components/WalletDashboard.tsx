import ExchangeForm from './ExchangeForm';
import TransactionList from './TransactionList';
import WalletBalances from './WalletBalances';
import { getTransactions, getWallet } from '@/server-actions/wallet';

type WalletDashboardProps = {
  walletId: number;
};

function LoadError({ message }: { message: string }) {
  return (
    <p className="rounded bg-danger/15 px-3 py-2 text-sm text-danger" role="status">
      {message}
    </p>
  );
}

export default async function WalletDashboard({ walletId }: WalletDashboardProps) {
  const [wallet, transactions] = await Promise.all([
    getWallet(walletId),
    getTransactions(walletId),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <section className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold">Wallet</h1>
        {wallet.ok ? (
          <WalletBalances
            balances={wallet.wallet.balances}
            totalUsd={wallet.wallet.totalUsd}
          />
        ) : (
          <LoadError message={wallet.message} />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Exchange</h2>
        {wallet.ok ? (
          <ExchangeForm walletId={walletId} balances={wallet.wallet.balances} />
        ) : (
          <p className="text-sm text-muted">
            The exchange form needs the wallet balances, which failed to load.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Transactions</h2>
        {transactions.ok ? (
          <TransactionList transactions={transactions.transactions} />
        ) : (
          <LoadError message={transactions.message} />
        )}
      </section>
    </main>
  );
}
