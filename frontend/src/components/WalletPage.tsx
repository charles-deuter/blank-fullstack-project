'use client';

import { useState } from 'react';
import WalletDisplay from './WalletDisplay';
import ExchangeForm from './ExchangeForm';
import ExchangeLog from './ExchangeLog';
import type { WalletBalance } from '@/server-actions/wallet';
import type { ExchangeRecord } from '@/server-actions/exchange';
import type { CurrencyMetaMap, RateMap } from '@/lib/currency';

type WalletPageProps = {
  initialBalances: WalletBalance[];
  initialExchanges: ExchangeRecord[];
  rates: RateMap;
  currencies: CurrencyMetaMap;
};

export default function WalletPage({
  initialBalances,
  initialExchanges,
  rates,
  currencies,
}: WalletPageProps) {
  const [balances, setBalances] = useState(initialBalances);
  const [exchanges, setExchanges] = useState(initialExchanges);

  function handleExchangeComplete(
    nextBalances: WalletBalance[],
    nextExchanges: ExchangeRecord[],
  ) {
    setBalances(nextBalances);
    setExchanges(nextExchanges);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <WalletDisplay balances={balances} currencies={currencies} />
        <ExchangeForm
          balances={balances}
          rates={rates}
          currencies={currencies}
          onExchangeComplete={handleExchangeComplete}
        />
      </div>
      <ExchangeLog exchanges={exchanges} currencies={currencies} />
    </div>
  );
}
