'use client';

import { useEffect, useState, useTransition } from 'react';
import SelectField from '@/components/forms/SelectField';
import TextField from '@/components/forms/TextField';
import {
  CURRENCIES,
  CURRENCY_DECIMALS,
  CURRENCY_LABELS,
  formatAmount,
  parseAmount,
  precisionHint,
  type Currency,
} from '@/lib/money';
import {
  createExchange,
  previewExchange,
  type Balance,
  type ExchangePreview,
} from '@/server-actions/wallet';

const PREVIEW_DEBOUNCE_MS = 300;

type Status = { ok: boolean; message: string };

/** A priced exchange, tagged with the form state it was fetched for. */
type Quote = {
  key: string;
  preview: ExchangePreview | null;
  error: string | null;
};

type ExchangeFormProps = {
  walletId: number;
  balances: Balance[];
};

function otherCurrency(exclude: Currency): Currency {
  return CURRENCIES.find((currency) => currency !== exclude)!;
}

export default function ExchangeForm({ walletId, balances }: ExchangeFormProps) {
  const [fromCurrency, setFromCurrency] = useState<Currency>('USD');
  const [toCurrency, setToCurrency] = useState<Currency>('EUR');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  const balance = balances.find((entry) => entry.currency === fromCurrency)?.amount ?? 0;
  const parsedAmount = parseAmount(amount, fromCurrency);

  // Identifies the exchange the panel is currently describing. A quote fetched
  // for a different key is stale by definition, so it can never be shown against
  // an amount or a pair the user has since changed.
  const quoteKey =
    parsedAmount !== null && parsedAmount > 0
      ? `${fromCurrency}:${toCurrency}:${parsedAmount}`
      : null;

  const activeQuote = quoteKey !== null && quote?.key === quoteKey ? quote : null;
  const preview = activeQuote?.preview ?? null;
  const previewError = activeQuote?.error ?? null;

  function validateAmount(raw: string): string | null {
    const trimmed = raw.trim();

    if (trimmed === '') {
      return 'Enter an amount to exchange';
    }

    if (!/^\d+(\.\d*)?$/.test(trimmed)) {
      return 'Enter a valid amount';
    }

    const minor = parseAmount(trimmed, fromCurrency);

    if (minor === null) {
      return precisionHint(fromCurrency);
    }

    if (minor <= 0) {
      return 'Amount must be greater than zero';
    }

    if (minor > balance) {
      return `Insufficient balance — you have ${formatAmount(balance, fromCurrency)} ${fromCurrency}`;
    }

    return null;
  }

  // The received amount comes from the backend so the rate has a single owner.
  // Server Actions dispatch one at a time, so typing is debounced rather than
  // queueing a request per keystroke.
  useEffect(() => {
    if (quoteKey === null || parsedAmount === null) {
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      const result = await previewExchange(fromCurrency, toCurrency, parsedAmount);

      if (cancelled) {
        return;
      }

      setQuote({
        key: quoteKey,
        preview: result.ok ? result.preview : null,
        error: result.ok ? null : result.message,
      });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [quoteKey, parsedAmount, fromCurrency, toCurrency]);

  function handleFromChange(next: Currency) {
    setFromCurrency(next);

    if (next === toCurrency) {
      setToCurrency(otherCurrency(next));
    }

    // The precision rules and the available balance both just changed, so a
    // message about the previous currency would be wrong.
    setAmountError(null);
    setStatus(null);
  }

  function handleToChange(next: Currency) {
    setToCurrency(next);
    setStatus(null);
  }

  const roundsToZero = preview !== null && preview.toAmount === 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validateAmount(amount);

    setAmountError(error);
    setStatus(null);

    if (error !== null || parsedAmount === null) {
      return;
    }

    if (roundsToZero) {
      setAmountError(`That much ${fromCurrency} rounds down to zero ${toCurrency}`);
      return;
    }

    startSubmit(async () => {
      const result = await createExchange(
        walletId,
        fromCurrency,
        toCurrency,
        parsedAmount,
      );

      if (!result.ok) {
        setStatus({ ok: false, message: result.message });
        return;
      }

      setAmount('');
      setQuote(null);
      setStatus({
        ok: true,
        message: `Exchanged ${formatAmount(result.transaction.from_amount, fromCurrency)} ${fromCurrency} for ${formatAmount(result.transaction.to_amount, toCurrency)} ${toCurrency}`,
      });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-edge bg-surface p-4 shadow-sm"
    >
      <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="From"
            value={fromCurrency}
            onChange={(event) => handleFromChange(event.target.value as Currency)}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency} — {CURRENCY_LABELS[currency]}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="To"
            value={toCurrency}
            onChange={(event) => handleToChange(event.target.value as Currency)}
          >
            {CURRENCIES.filter((currency) => currency !== fromCurrency).map(
              (currency) => (
                <option key={currency} value={currency}>
                  {currency} — {CURRENCY_LABELS[currency]}
                </option>
              ),
            )}
          </SelectField>
        </div>

        <TextField
          label={`Amount (${fromCurrency})`}
          inputMode="decimal"
          autoComplete="off"
          placeholder={CURRENCY_DECIMALS[fromCurrency] === 0 ? '0' : '0.00'}
          value={amount}
          error={amountError}
          onChange={(event) => {
            setAmount(event.target.value);
            setStatus(null);

            // First feedback waits for blur, but once a message is showing it
            // clears as soon as the value is good rather than lingering while
            // the user fixes it.
            if (amountError !== null) {
              setAmountError(validateAmount(event.target.value));
            }
          }}
          onBlur={(event) => setAmountError(validateAmount(event.target.value))}
        />

        <div className="flex flex-col gap-1 rounded-md border border-edge bg-elevated px-3 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Available</span>
            <span className="tabular-nums text-ink">
              {formatAmount(balance, fromCurrency)} {fromCurrency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">You receive</span>
            <span className="tabular-nums text-ink">
              {preview ? (
                `${formatAmount(preview.toAmount, toCurrency)} ${toCurrency}`
              ) : (
                <span className="text-muted">—</span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Rate</span>
            <span className="tabular-nums text-muted">
              {preview ? `1 ${fromCurrency} = ${preview.rate} ${toCurrency}` : '—'}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {isSubmitting ? 'Exchanging…' : 'Exchange'}
        </button>
      </fieldset>

      <div role="status" aria-live="polite" className="min-h-9">
        {(status || previewError) && (
          <p
            className={`rounded px-3 py-2 text-sm ${
              status?.ok ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
            }`}
          >
            {status?.message ?? previewError}
          </p>
        )}
      </div>
    </form>
  );
}
