'use client';

import { useState } from 'react';
import ExchangeForm from '@/components/ExchangeForm';
import TransactionTable from '@/components/TransactionTable';
import WalletBalances from '@/components/WalletBalances';
import type { Balance, Currency, Transaction } from '@/server-actions/wallet';

type ExchangeDashboardProps = {
  currencies: Currency[];
  initialBalances: Balance[];
  initialTransactions: Transaction[];
};

export default function ExchangeDashboard({
  currencies,
  initialBalances,
  initialTransactions,
}: ExchangeDashboardProps) {
  const [balances, setBalances] = useState(initialBalances);
  const [transactions, setTransactions] = useState(initialTransactions);

  function handleExchanged(transaction: Transaction, updatedBalances: Balance[]) {
    setBalances(updatedBalances);
    // The list is ordered newest first, so the new row belongs at the front.
    setTransactions((current) => [transaction, ...current]);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Wallet</h2>
        <WalletBalances currencies={currencies} balances={balances} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Exchange</h2>
        <ExchangeForm
          currencies={currencies}
          balances={balances}
          onExchanged={handleExchanged}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Transactions</h2>
        <TransactionTable currencies={currencies} transactions={transactions} />
      </section>
    </div>
  );
}
