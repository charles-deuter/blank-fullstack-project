export interface Currency {
  code: CurrencyCode;
  /** How many units of this currency one USD buys. */
  rate: number;
  /** Decimal places in this currency's minor unit (cents, yen, fen). */
  decimals: number;
}

export const BASE_CURRENCY = 'USD';

export const CURRENCIES: Currency[] = [
  { code: 'USD', rate: 1, decimals: 2 },
  { code: 'EUR', rate: 0.92, decimals: 2 },
  { code: 'GBP', rate: 0.79, decimals: 2 },
  { code: 'JPY', rate: 150, decimals: 0 },
  { code: 'CNY', rate: 7.25, decimals: 2 },
];

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY';

export function isCurrency(value: unknown): value is CurrencyCode {
  return (
    typeof value === 'string' && CURRENCIES.some((currency) => currency.code === value)
  );
}

function currencyOf(code: CurrencyCode): Currency {
  const currency = CURRENCIES.find((candidate) => candidate.code === code);

  if (!currency) {
    throw new Error(`unsupported currency: ${code}`);
  }

  return currency;
}

// Binary floating point lands exact results just under the integer -- 0.92 * 100000
// comes out as 91999.99999999999 -- and flooring that would silently lose a minor
// unit. Nine decimal places is orders of magnitude finer than any real remainder.
function dropFloatNoise(value: number): number {
  return Number(value.toFixed(9));
}

export function toMinorUnits(amount: number, code: CurrencyCode): number {
  return Math.floor(dropFloatNoise(amount * 10 ** currencyOf(code).decimals));
}

export function fromMinorUnits(minorUnits: number, code: CurrencyCode): number {
  return minorUnits / 10 ** currencyOf(code).decimals;
}

/** Effective rate from one currency to another, both normalized against USD. */
export function rateBetween(from: CurrencyCode, to: CurrencyCode): number {
  return dropFloatNoise(currencyOf(to).rate / currencyOf(from).rate);
}

export function convertMinorUnits(
  fromMinorUnits: number,
  from: CurrencyCode,
  to: CurrencyCode,
): number {
  const source = currencyOf(from);
  const target = currencyOf(to);

  // Multiply before dividing so there is a single rounding step at the end.
  const converted =
    (fromMinorUnits * target.rate * 10 ** target.decimals) /
    (source.rate * 10 ** source.decimals);

  return Math.floor(dropFloatNoise(converted));
}
