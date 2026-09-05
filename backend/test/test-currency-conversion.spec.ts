import {
  convert,
  usdMinorValue,
  formatRateUsd,
  isCurrencyCode,
  CURRENCY_CODES,
} from '../src/services/currency';

describe('convert', () => {
  // Worked example from the PRD: EUR 5000 minor units (€50.00) at 1.08 USD/EUR
  // into JPY at 0.0067 USD/JPY, pivoted through USD in one expression.
  it('should convert between two non-USD currencies through the USD pivot', () => {
    expect(convert(5000n, 'EUR', 'JPY')).toBe(8059n);
  });

  it('should treat JPY as exponent 0 rather than assuming two decimal places', () => {
    // ¥26,626 at 0.0067 USD/JPY is $178.3942, floored to 17839 cents. Assuming
    // an exponent of 2 would be off by a factor of 100.
    expect(convert(26626n, 'JPY', 'USD')).toBe(17839n);
  });

  it('should floor the output rather than rounding it', () => {
    // $1.00 buys ¥149.2537…; the fraction is discarded, not rounded up.
    expect(convert(100n, 'USD', 'JPY')).toBe(149n);
  });

  it('should lose value on a round trip rather than creating it', () => {
    const outbound = convert(100n, 'USD', 'JPY');

    expect(convert(outbound, 'JPY', 'USD')).toBe(99n);
  });

  it('should floor a sub-unit conversion to zero', () => {
    // ¥1 is worth less than a penny in GBP. The route rejects this as dust.
    expect(convert(1n, 'JPY', 'GBP')).toBe(0n);
  });

  it('should return the same amount when converting a currency to itself', () => {
    expect(convert(16423n, 'USD', 'USD')).toBe(16423n);
  });
});

describe('usdMinorValue', () => {
  // The five seeded balances and their USD cent values, from the PRD seed table.
  it.each([
    ['USD', 16423n, 16423n],
    ['EUR', 17361n, 18749n],
    ['GBP', 8890n, 11290n],
    ['CNY', 102571n, 14359n],
    ['JPY', 26626n, 17839n],
  ] as const)(
    'should value %s %s minor units at %s USD cents',
    (currency, minor, expected) => {
      expect(usdMinorValue(minor, currency)).toBe(expected);
    },
  );

  it('should sum the seeded wallet to the PRD total', () => {
    const total =
      usdMinorValue(16423n, 'USD') +
      usdMinorValue(17361n, 'EUR') +
      usdMinorValue(8890n, 'GBP') +
      usdMinorValue(102571n, 'CNY') +
      usdMinorValue(26626n, 'JPY');

    expect(total).toBe(78660n);
  });
});

describe('formatRateUsd', () => {
  it.each([
    ['USD', '1.00'],
    ['EUR', '1.08'],
    ['GBP', '1.27'],
    ['CNY', '0.14'],
    ['JPY', '0.0067'],
  ] as const)('should format the %s rate as %s', (currency, expected) => {
    expect(formatRateUsd(currency)).toBe(expected);
  });
});

describe('isCurrencyCode', () => {
  it('should accept every supported code', () => {
    expect(CURRENCY_CODES).toEqual(['USD', 'EUR', 'GBP', 'CNY', 'JPY']);
    expect(CURRENCY_CODES.every(isCurrencyCode)).toBe(true);
  });

  it.each([['usd'], ['CHF'], [''], [42], [null], [undefined], [{}]])(
    'should reject %p',
    (value) => {
      expect(isCurrencyCode(value)).toBe(false);
    },
  );
});
