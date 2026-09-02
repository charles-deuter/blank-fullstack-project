import { loadPaymentsSnapshot } from '@/server-actions/wallet';
import PaymentsDashboard from './PaymentsDashboard';

/**
 * Who you are signed in as. There is no auth and no users table — a wallet is the
 * whole identity — so the sender is a constant until there is something to derive it
 * from. Wallet 1 is the first row the seed migration inserts (Ada Lovelace, $100.00).
 */
const SENDER_WALLET_ID = 1;

export default async function PaymentsPanel() {
  const result = await loadPaymentsSnapshot(SENDER_WALLET_ID);

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4 px-8 pb-8">
      <h2 className="text-lg font-semibold">Send money</h2>

      {result.ok ? (
        <PaymentsDashboard initialSnapshot={result.snapshot} />
      ) : (
        <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">
          {result.message}
        </p>
      )}
    </section>
  );
}
