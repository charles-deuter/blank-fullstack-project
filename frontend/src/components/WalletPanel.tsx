import { getWallet, listExchanges } from '@/server-actions/wallet';
import BalanceTable from './BalanceTable';

// The demo wallet seeded by the migration. There is no auth and no wallet
// picker, so there is exactly one.
const DEMO_WALLET_ID = 1;

export default async function WalletPanel() {
  const [wallet, exchanges] = await Promise.all([
    getWallet(DEMO_WALLET_ID),
    listExchanges(DEMO_WALLET_ID),
  ]);

  const initialError = !wallet.ok
    ? wallet.message
    : !exchanges.ok
      ? exchanges.message
      : null;

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4 px-8 pb-8">
      <h2 className="text-lg font-semibold">Currency wallet</h2>
      <BalanceTable
        walletId={DEMO_WALLET_ID}
        initialWallet={wallet.ok ? wallet.wallet : null}
        initialExchanges={exchanges.ok ? exchanges.exchanges : []}
        initialError={initialError}
      />
    </section>
  );
}
