export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'] as const;

export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_DECIMALS: Record<Currency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  CNY: 2,
};

// Rates are scaled by RATE_SCALE so the conversion math can stay in BigInt and
// never drift the way binary floating point does on repeated exchanges.
const RATE_SCALE = 100_000_000n;

// "One major unit of this currency is worth N USD", scaled by RATE_SCALE.
const USD_RATE_SCALED: Record<Currency, bigint> = {
  USD: 100_000_000n, // 1.00
  EUR: 110_000_000n, // 1.10
  GBP: 127_000_000n, // 1.27
  JPY: 670_000n, // 0.0067
  CNY: 14_000_000n, // 0.14
};

const RATE_DISPLAY_DECIMALS = 8;

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value);
}

function minorUnitsPerMajor(currency: Currency): bigint {
  return 10n ** BigInt(CURRENCY_DECIMALS[currency]);
}

/**
 * Converts an amount held in `from`'s smallest unit into `to`'s smallest unit.
 * Truncating BigInt division discards any sub-cent (or sub-yen) remainder, so
 * the wallet can never credit value that was not actually exchanged.
 */
export function convert(amount: number, from: Currency, to: Currency): number {
  const numerator = BigInt(amount) * USD_RATE_SCALED[from] * minorUnitsPerMajor(to);
  const denominator = minorUnitsPerMajor(from) * USD_RATE_SCALED[to];

  return Number(numerator / denominator);
}

/** The effective major-unit rate: one unit of `from` buys this many of `to`. */
export function effectiveRate(from: Currency, to: Currency): string {
  const scale = 10n ** BigInt(RATE_DISPLAY_DECIMALS);
  const scaled = (USD_RATE_SCALED[from] * scale) / USD_RATE_SCALED[to];
  const whole = scaled / scale;
  const fraction = (scaled % scale).toString().padStart(RATE_DISPLAY_DECIMALS, '0');

  return `${whole}.${fraction}`;
}

export function toUsdCents(amount: number, currency: Currency): number {
  return convert(amount, currency, 'USD');
}
