import type { Currency } from '@/server-actions/wallet';

// Locale is pinned so the server and client render identical strings; letting it
// fall back to the runtime default produces a hydration mismatch.
const LOCALE = 'en-US';

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

// Binary floating point lands exact results just under the integer, and flooring
// that would lose a minor unit. Mirrors the backend's guard in src/domain/currency.ts.
function dropFloatNoise(value: number): number {
  return Number(value.toFixed(9));
}

export function toMinorUnits(amount: number, currency: Currency): number {
  return Math.floor(dropFloatNoise(amount * 10 ** currency.decimals));
}

export function convertMinorUnits(
  fromMinorUnits: number,
  from: Currency,
  to: Currency,
): number {
  const converted =
    (fromMinorUnits * to.rate * 10 ** to.decimals) / (from.rate * 10 ** from.decimals);

  return Math.floor(dropFloatNoise(converted));
}

export function formatMinorUnits(minorUnits: number, currency: Currency): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: currency.code,
  }).format(minorUnits / 10 ** currency.decimals);
}

/** Human-readable direction, e.g. "1 USD = 0.92 EUR". */
export function formatRate(from: Currency, to: Currency, rate: number): string {
  return `1 ${from.code} = ${rate.toLocaleString(LOCALE, {
    maximumFractionDigits: 4,
  })} ${to.code}`;
}

export function formatTimestamp(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

export function findCurrency(currencies: Currency[], code: string): Currency {
  return currencies.find((currency) => currency.code === code)!;
}
