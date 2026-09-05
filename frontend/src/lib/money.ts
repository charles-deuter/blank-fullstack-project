// Amounts arrive from the backend as decimal strings of integer minor units,
// because JSON cannot carry a bigint. Nothing here does arithmetic on them
// beyond placing the decimal point: the conversion math lives on the server,
// and a second implementation here would be free to drift from it.

// Pinned locale, like the timestamp formatting in FooTable, so the server and
// the client produce identical text and cannot trip a hydration mismatch.
const groupedInteger = new Intl.NumberFormat('en-US');

/** Render minor units as a grouped decimal string: `("102571", 2)` → `1,025.71`. */
export function formatMinor(minor: string, exponent: number): string {
  const negative = minor.startsWith('-');
  const digits = (negative ? minor.slice(1) : minor).padStart(exponent + 1, '0');
  const whole = digits.slice(0, digits.length - exponent);
  const fraction = exponent === 0 ? '' : `.${digits.slice(digits.length - exponent)}`;

  return `${negative ? '-' : ''}${groupedInteger.format(BigInt(whole))}${fraction}`;
}

/** Render USD minor units (cents) with a leading `$`. */
export function formatUsd(cents: string): string {
  return `$${formatMinor(cents, 2)}`;
}

/**
 * Parse a whole-unit amount typed by a person into the minor-unit string the
 * API expects. Returns null for anything that is not a positive amount with at
 * most `exponent` decimal places — JPY takes no decimals at all.
 */
export function parseMajorToMinor(input: string, exponent: number): string | null {
  const trimmed = input.trim();

  if (!/^[0-9]*(\.[0-9]*)?$/.test(trimmed) || trimmed === '' || trimmed === '.') {
    return null;
  }

  const [whole, fraction = ''] = trimmed.split('.');

  if (fraction.length > exponent) {
    return null;
  }

  const minor = `${whole}${fraction.padEnd(exponent, '0')}`.replace(/^0+(?=[0-9])/, '');

  return minor === '0' ? null : minor;
}
