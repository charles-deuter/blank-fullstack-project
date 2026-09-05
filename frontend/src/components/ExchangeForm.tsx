'use client';

import { useState, useTransition } from 'react';
import {
  getExchangeHistory,
  performExchange,
  type ExchangeRecord,
} from '@/server-actions/exchange';
import { getWalletBalances, type WalletBalance } from '@/server-actions/wallet';
import {
  convert,
  crossRate,
  formatSmallestUnit,
  toSmallestUnit,
  toWholeUnit,
  type CurrencyMeta,
  type CurrencyMetaMap,
  type RateMap,
} from '@/lib/currency';

const AMOUNT_ERROR_ID = 'exchange-amount-error';

type ExchangeFormProps = {
  balances: WalletBalance[];
  rates: RateMap;
  currencies: CurrencyMetaMap;
  onExchangeComplete: (balances: WalletBalance[], exchanges: ExchangeRecord[]) => void;
};

// Every check here runs on data the page already holds, so an exchange that is certain
// to fail never costs a round trip. The backend re-validates all of it regardless —
// this is for the user's benefit, not the server's.
function validateAmount(
  raw: string,
  currency: string,
  meta: CurrencyMeta | undefined,
  available: number,
): string | null {
  if (raw.trim() === '') return 'Enter an amount to exchange.';

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return 'Enter a valid number.';
  if (parsed <= 0) return 'Enter an amount greater than zero.';
  if (!meta) return null;

  // Submitting more precision than the currency has would silently round the amount,
  // so reject it here rather than exchange something the user did not type.
  const smallest = toSmallestUnit(parsed, meta);
  if (Math.abs(toWholeUnit(smallest, meta) - parsed) > 1e-9) {
    return meta.decimalPlaces === 0
      ? `${currency} amounts must be whole numbers.`
      : `${currency} amounts can have at most ${meta.decimalPlaces} decimal places.`;
  }

  if (smallest > available) {
    const held = formatSmallestUnit(available, currency, meta);
    return `Insufficient ${currency} balance — you have ${held}.`;
  }

  return null;
}

export default function ExchangeForm({
  balances,
  rates,
  currencies,
  onExchangeComplete,
}: ExchangeFormProps) {
  const codes = Object.keys(currencies);
  const [fromCurrency, setFromCurrency] = useState(codes[0]);
  const [toCurrency, setToCurrency] = useState(codes[1]);
  const [amount, setAmount] = useState('');
  // Validation messages stay hidden until the field is blurred or the form submitted,
  // so the first keystroke of a valid entry is never met with an error.
  const [amountTouched, setAmountTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const targetCodes = codes.filter((code) => code !== fromCurrency);
  const fromMeta = currencies[fromCurrency];
  const toMeta = currencies[toCurrency];
  const available =
    balances.find((balance) => balance.currency === fromCurrency)?.amount ?? 0;

  const amountError = validateAmount(amount, fromCurrency, fromMeta, available);
  const visibleAmountError = amountTouched ? amountError : null;

  // Selecting the source currency that is already the target would leave both selects
  // on one currency, which the backend rejects; move the target to the next option.
  function handleFromChange(next: string) {
    setFromCurrency(next);
    if (next === toCurrency) {
      setToCurrency(codes.find((code) => code !== next) ?? next);
    }
  }

  function previewText(): string | null {
    if (amountError || !fromMeta || !toMeta) return null;

    // Rounded through the smallest unit, so this is the amount the exchange credits
    // rather than an unrounded floating-point figure.
    const received = convert(
      toSmallestUnit(Number.parseFloat(amount), fromMeta),
      fromMeta,
      toMeta,
      crossRate(rates, fromCurrency, toCurrency),
    );

    return `You will receive ${formatSmallestUnit(received, toCurrency, toMeta)}`;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setAmountTouched(true);

    if (amountError) return;

    startTransition(async () => {
      const result = await performExchange(
        fromCurrency,
        toCurrency,
        toSmallestUnit(Number.parseFloat(amount), fromMeta),
      );

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      // Re-read rather than patching locally, so the server stays the single source of
      // truth for both the balances and the log ordering.
      const [wallet, history] = await Promise.all([
        getWalletBalances(),
        getExchangeHistory(),
      ]);

      if (!wallet.ok) {
        setFormError(wallet.message);
        return;
      }

      if (!history.ok) {
        setFormError(history.message);
        return;
      }

      setAmount('');
      setAmountTouched(false);
      onExchangeComplete(wallet.balances, history.exchanges);
    });
  }

  const preview = previewText();

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Exchange Currency</h2>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-medium text-gray-600">From</span>
            <select
              value={fromCurrency}
              onChange={(event) => handleFromChange(event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            >
              {codes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-medium text-gray-600">To</span>
            <select
              value={toCurrency}
              onChange={(event) => setToCurrency(event.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            >
              {targetCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-600">
            Amount ({fromCurrency})
          </span>
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            onBlur={() => setAmountTouched(true)}
            aria-invalid={visibleAmountError ? true : undefined}
            aria-describedby={visibleAmountError ? AMOUNT_ERROR_ID : undefined}
            placeholder="0.00"
            step="any"
            min="0"
            className={`rounded border px-3 py-2 ${
              visibleAmountError
                ? 'border-red-500 focus:outline-red-500'
                : 'border-gray-300'
            }`}
          />
          {visibleAmountError && (
            <span id={AMOUNT_ERROR_ID} role="alert" className="text-sm text-red-700">
              {visibleAmountError}
            </span>
          )}
        </label>

        <div aria-live="polite" className="min-h-9">
          {preview && (
            <p className="rounded bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {preview}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Exchanging…' : 'Exchange'}
        </button>

        {formError && (
          <p role="alert" className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        )}
      </form>
    </section>
  );
}
