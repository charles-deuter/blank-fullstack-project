// Money is integer minor units throughout. Rates are integers scaled by 1e10 so
// the whole conversion runs in BigInt and never touches a float.

export const RATE_SCALE_EXPONENT = 10;

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CNY' | 'JPY';

type CurrencyDefinition = {
  // Decimal places in the minor unit: 2 for cents, 0 for yen. A blanket
  // "multiply by 100" is wrong for JPY, so every parse, format and conversion
  // has to consult this.
  exponent: number;
  // USD per one whole unit of the currency, scaled by 10^RATE_SCALE_EXPONENT.
  usdPerUnitScaled: bigint;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyDefinition> = {
  USD: { exponent: 2, usdPerUnitScaled: 10_000_000_000n },
  EUR: { exponent: 2, usdPerUnitScaled: 10_800_000_000n },
  GBP: { exponent: 2, usdPerUnitScaled: 12_700_000_000n },
  CNY: { exponent: 2, usdPerUnitScaled: 1_400_000_000n },
  JPY: { exponent: 0, usdPerUnitScaled: 67_000_000n },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

/**
 * Convert minor units of one currency into minor units of another, pivoting
 * through USD in a single expression — one division, one rounding. The result
 * is floored (BigInt division truncates toward zero and amounts are never
 * negative), so an exchange can only lose fractions, never mint them.
 */
export function convert(fromMinor: bigint, from: CurrencyCode, to: CurrencyCode): bigint {
  const source = CURRENCIES[from];
  const target = CURRENCIES[to];

  const numerator = fromMinor * source.usdPerUnitScaled * 10n ** BigInt(target.exponent);
  const denominator = target.usdPerUnitScaled * 10n ** BigInt(source.exponent);

  return numerator / denominator;
}

/** The value of an amount in USD minor units (cents), floored like any exchange. */
export function usdMinorValue(minor: bigint, currency: CurrencyCode): bigint {
  return convert(minor, currency, 'USD');
}

/**
 * The USD-per-unit rate as a decimal string for display. Trailing zeros are
 * trimmed to a minimum of two decimal places, so USD reads "1.00" and JPY,
 * which needs the precision, reads "0.0067".
 */
export function formatRateUsd(currency: CurrencyCode): string {
  const scaled = CURRENCIES[currency].usdPerUnitScaled
    .toString()
    .padStart(RATE_SCALE_EXPONENT + 1, '0');
  const whole = scaled.slice(0, scaled.length - RATE_SCALE_EXPONENT);
  const fraction = scaled.slice(scaled.length - RATE_SCALE_EXPONENT).replace(/0+$/, '');

  return `${whole}.${fraction.padEnd(2, '0')}`;
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return (
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(CURRENCIES, value)
  );
}

/**
 * The USD-per-unit rate as a fixed 10-decimal string, matching the
 * `numeric(20,10)` columns that freeze the rate into each exchange row.
 */
export function rateUsdNumeric(currency: CurrencyCode): string {
  const scaled = CURRENCIES[currency].usdPerUnitScaled
    .toString()
    .padStart(RATE_SCALE_EXPONENT + 1, '0');

  return `${scaled.slice(0, scaled.length - RATE_SCALE_EXPONENT)}.${scaled.slice(scaled.length - RATE_SCALE_EXPONENT)}`;
}
