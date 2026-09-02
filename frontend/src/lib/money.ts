// Money is integer cents on both sides of the wire, matching the backend. Dollars
// exist only as display strings and as what the user types; they are never a number
// we do arithmetic on, because 0.1 + 0.2 is not 0.3.

const dollarsFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/** 12345 -> "$123.45". Division is safe here: the result is only ever formatted. */
export function formatCents(cents: number): string {
  return dollarsFormat.format(cents / 100);
}

/**
 * Parse what the user typed into whole cents, or null if it isn't an amount.
 *
 * Deliberately integer-only arithmetic — `Number('12.34') * 100` is 1233.9999…,
 * which rounds to the right answer often enough to hide the bug in testing.
 *
 * Accepts "25", "25.5", "25.50", "$1,234.56". Rejects negatives, zero, exponents,
 * and anything with more than two decimal places (which would be sub-cent money).
 */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, '').replace(/,/g, '');
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);

  if (!match) return null;

  const [, whole, fraction = ''] = match;
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));

  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
