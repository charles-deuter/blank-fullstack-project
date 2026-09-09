'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import SelectField from '@/components/forms/SelectField';
import TextField from '@/components/forms/TextField';
import {
  convertMinorUnits,
  findCurrency,
  formatMinorUnits,
  formatRate,
  toMinorUnits,
} from '@/lib/currency';
import {
  createExchange,
  type Balance,
  type Currency,
  type Transaction,
} from '@/server-actions/wallet';

type ExchangeFormProps = {
  currencies: Currency[];
  balances: Balance[];
  onExchanged: (transaction: Transaction, balances: Balance[]) => void;
};

function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed === '') {
    return null;
  }

  const value = Number(trimmed);

  return Number.isFinite(value) ? value : null;
}

export default function ExchangeForm({
  currencies,
  balances,
  onExchanged,
}: ExchangeFormProps) {
  const [fromCode, setFromCode] = useState('USD');
  const [toCode, setToCode] = useState('EUR');
  const [amount, setAmount] = useState('');
  const [amountBlurred, setAmountBlurred] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const from = findCurrency(currencies, fromCode);
  const to = findCurrency(currencies, toCode);
  const available =
    balances.find((balance) => balance.currency === fromCode)?.amount ?? 0;

  const parsedAmount = parseAmount(amount);
  const sameCurrency = fromCode === toCode;
  const requestedMinorUnits =
    parsedAmount === null ? null : toMinorUnits(parsedAmount, from);

  function amountValidationError(): string | null {
    if (amount.trim() === '') {
      return 'Enter an amount';
    }

    if (parsedAmount === null) {
      return 'Enter a valid number';
    }

    if (parsedAmount <= 0) {
      return 'Enter an amount greater than zero';
    }

    if (requestedMinorUnits === 0) {
      return `Amount is smaller than the smallest ${fromCode} unit`;
    }

    if (requestedMinorUnits !== null && requestedMinorUnits > available) {
      return `Not enough ${fromCode} — you have ${formatMinorUnits(available, from)}`;
    }

    return null;
  }

  const amountError = amountValidationError();
  const currencyError = sameCurrency ? 'Choose two different currencies' : null;
  const showAmountError = amountBlurred || submitAttempted;
  const isValid = amountError === null && currencyError === null;

  // Only preview a conversion the user could actually submit, so the number they
  // see is always the number they would get.
  const previewMinorUnits =
    isValid && requestedMinorUnits !== null
      ? convertMinorUnits(requestedMinorUnits, from, to)
      : null;

  function clearFeedback() {
    setSuccess(null);
    setSubmitError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    clearFeedback();

    if (!isValid || parsedAmount === null) {
      return;
    }

    startTransition(async () => {
      const result = await createExchange(fromCode, toCode, parsedAmount);

      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }

      const received = formatMinorUnits(result.transaction.to_amount, to);
      const spent = formatMinorUnits(result.transaction.from_amount, from);

      onExchanged(result.transaction, result.balances);
      setSuccess(`Exchanged ${spent} ${fromCode} for ${received} ${toCode}`);
      setAmount('');
      setAmountBlurred(false);
      setSubmitAttempted(false);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-edge bg-surface p-4 shadow-sm"
    >
      <div role="status" aria-live="polite">
        {success && (
          <p className="mb-4 rounded bg-success/15 px-3 py-2 text-sm text-success">
            {success}
          </p>
        )}
        {submitError && (
          <p className="mb-4 rounded bg-danger/15 px-3 py-2 text-sm text-danger">
            {submitError}
          </p>
        )}
      </div>

      <fieldset disabled={isPending} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="From"
            value={fromCode}
            onChange={(event) => {
              setFromCode(event.target.value);
              clearFeedback();
            }}
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="To"
            value={toCode}
            error={currencyError}
            onChange={(event) => {
              setToCode(event.target.value);
              clearFeedback();
            }}
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="flex flex-col gap-1.5">
          <TextField
            label={`Amount in ${fromCode}`}
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            error={showAmountError ? amountError : null}
            onBlur={() => setAmountBlurred(true)}
            onChange={(event) => {
              setAmount(event.target.value);
              clearFeedback();
            }}
          />
          <p className="text-xs text-muted">
            Available: {formatMinorUnits(available, from)}
          </p>
        </div>

        <div className="rounded-md border border-edge bg-elevated px-3 py-2.5">
          {previewMinorUnits === null ? (
            <p className="text-sm text-muted">
              Enter an amount to preview the conversion
            </p>
          ) : (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-sm text-muted">You receive</span>
              <span className="text-lg font-semibold tabular-nums text-ink">
                {formatMinorUnits(previewMinorUnits, to)} {toCode}
              </span>
              <span className="w-full text-xs text-muted tabular-nums">
                {formatRate(from, to, to.rate / from.rate)}
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="self-start rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {isPending ? 'Exchanging…' : 'Exchange'}
        </button>
      </fieldset>
    </form>
  );
}
