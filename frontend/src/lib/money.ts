export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'] as const;

export type Currency = (typeof CURRENCIES)[number];

/**
 * How many decimal places each currency shows. Amounts cross the wire in the
 * smallest unit, so this is what turns 10050 into "100.50" — and what decides
 * how much precision the amount input accepts.
 */
export const CURRENCY_DECIMALS: Record<Currency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  CNY: 2,
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan',
};

// Locale is pinned so the server and the client format identically; letting it
// default would render different text and trip a hydration mismatch.
const groupedFormat = new Intl.NumberFormat('en-US');

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

/** Renders a smallest-unit amount, e.g. (10050, 'USD') -> "100.50". */
export function formatAmount(amount: number, currency: Currency): string {
  const decimals = CURRENCY_DECIMALS[currency];

  if (decimals === 0) {
    return groupedFormat.format(amount);
  }

  const divisor = 10 ** decimals;
  const whole = Math.floor(amount / divisor);
  const fraction = String(amount % divisor).padStart(decimals, '0');

  return `${groupedFormat.format(whole)}.${fraction}`;
}

export function formatUsd(cents: number): string {
  return `$${formatAmount(cents, 'USD')}`;
}

/**
 * Parses typed input into the currency's smallest unit, or null when the text is
 * not a valid amount for that currency. Digits are read as a string rather than
 * scaled through a float, so "100.10" cannot land on 10009.999999999998.
 */
export function parseAmount(raw: string, currency: Currency): number | null {
  const trimmed = raw.trim();
  const match = /^(\d+)(?:\.(\d*))?$/.exec(trimmed);

  if (!match) {
    return null;
  }

  const [, whole, fraction = ''] = match;
  const decimals = CURRENCY_DECIMALS[currency];

  if (fraction.length > decimals) {
    return null;
  }

  return Number(whole + fraction.padEnd(decimals, '0'));
}

/** Human-readable precision hint for a currency, used in validation messages. */
export function precisionHint(currency: Currency): string {
  return CURRENCY_DECIMALS[currency] === 0
    ? `${currency} amounts must be whole numbers`
    : `${currency} amounts allow at most ${CURRENCY_DECIMALS[currency]} decimal places`;
}
