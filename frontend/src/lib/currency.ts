// Currency amounts cross the wire as integers in each currency's smallest unit:
// cents for USD/EUR/GBP/CNY (decimalPlaces 2), yen for JPY (decimalPlaces 0).
// Nothing outside this module should do the 10^decimalPlaces arithmetic.

export type CurrencyMeta = {
  decimalPlaces: number;
  symbol: string;
};

export type CurrencyMetaMap = Record<string, CurrencyMeta>;

export type RateMap = Record<string, number>;

function factor(meta: CurrencyMeta): number {
  return 10 ** meta.decimalPlaces;
}

export function toWholeUnit(smallest: number, meta: CurrencyMeta): number {
  return smallest / factor(meta);
}

// Rounds the way `toSmallestUnit` in backend/src/constants/currencies.ts rounds, so a
// preview computed here matches the amount the backend actually credits.
export function toSmallestUnit(whole: number, meta: CurrencyMeta): number {
  return Math.round(whole * factor(meta));
}

// Locale is pinned so the server and the client format identically; letting it default
// would render different text and trip a hydration mismatch.
export function formatSmallestUnit(
  smallest: number,
  currency: string,
  meta: CurrencyMeta,
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: meta.decimalPlaces,
    maximumFractionDigits: meta.decimalPlaces,
  }).format(toWholeUnit(smallest, meta));
}

// Converting through the smallest unit means the preview shows exactly what the
// exchange will credit, rather than an unrounded floating-point figure.
export function convert(
  sourceSmallest: number,
  from: CurrencyMeta,
  to: CurrencyMeta,
  rate: number,
): number {
  return toSmallestUnit(toWholeUnit(sourceSmallest, from) * rate, to);
}

// Rates are quoted against USD, so a cross-rate is the ratio of the two.
export function crossRate(rates: RateMap, from: string, to: string): number {
  return (rates[to] ?? 1) / (rates[from] ?? 1);
}
