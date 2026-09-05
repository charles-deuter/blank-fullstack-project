export const CURRENCY_CODES = ['USD', 'JPY', 'EUR', 'GBP', 'CNY'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const CURRENCIES: Record<CurrencyCode, { decimalPlaces: number; symbol: string }> =
  {
    USD: { decimalPlaces: 2, symbol: '$' },
    JPY: { decimalPlaces: 0, symbol: '¥' },
    EUR: { decimalPlaces: 2, symbol: '€' },
    GBP: { decimalPlaces: 2, symbol: '£' },
    CNY: { decimalPlaces: 2, symbol: '¥' },
  };

export const RATES_TO_USD: Record<CurrencyCode, number> = {
  USD: 1,
  JPY: 149.5,
  EUR: 0.92,
  GBP: 0.79,
  CNY: 7.24,
};

export function getRate(from: CurrencyCode, to: CurrencyCode): number {
  return RATES_TO_USD[to] / RATES_TO_USD[from];
}

export function toSmallestUnit(whole: number, currency: CurrencyCode): number {
  const factor = Math.pow(10, CURRENCIES[currency].decimalPlaces);
  return Math.round(whole * factor);
}

export function toWholeUnit(smallest: number, currency: CurrencyCode): number {
  const factor = Math.pow(10, CURRENCIES[currency].decimalPlaces);
  return smallest / factor;
}
