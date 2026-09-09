import {
  CURRENCIES,
  convertMinorUnits,
  isCurrency,
  toMinorUnits,
} from '../src/domain/currency';

describe('isCurrency', () => {
  it.each(['USD', 'EUR', 'GBP', 'JPY', 'CNY'])('should accept %s', (code) => {
    expect(isCurrency(code)).toBe(true);
  });

  it.each([
    ['a lowercase code', 'usd'],
    ['an unsupported code', 'CHF'],
    ['an empty string', ''],
    ['a number', 42],
    ['null', null],
    ['undefined', undefined],
  ])('should reject %s', (_label, value) => {
    expect(isCurrency(value)).toBe(false);
  });
});

describe('CURRENCIES', () => {
  it('should expose all five currencies normalized to USD', () => {
    expect(CURRENCIES.map((c) => c.code)).toEqual(['USD', 'EUR', 'GBP', 'JPY', 'CNY']);
  });

  it('should use USD as the base with a rate of exactly 1', () => {
    expect(CURRENCIES.find((c) => c.code === 'USD')?.rate).toBe(1);
  });

  it('should give JPY zero minor-unit decimals and the others two', () => {
    const decimals = Object.fromEntries(CURRENCIES.map((c) => [c.code, c.decimals]));

    expect(decimals).toEqual({ USD: 2, EUR: 2, GBP: 2, JPY: 0, CNY: 2 });
  });
});

describe('toMinorUnits', () => {
  it('should convert dollars to cents', () => {
    expect(toMinorUnits(1000, 'USD')).toBe(100000);
  });

  it('should leave yen whole', () => {
    expect(toMinorUnits(1000, 'JPY')).toBe(1000);
  });

  it('should floor a sub-cent remainder', () => {
    expect(toMinorUnits(10.999, 'USD')).toBe(1099);
  });

  it('should floor a sub-yen remainder', () => {
    expect(toMinorUnits(10.9, 'JPY')).toBe(10);
  });
});

describe('convertMinorUnits', () => {
  it('should convert USD to EUR at the hardcoded rate', () => {
    // $100.00 -> 10000 cents; 10000 * 0.92 = 9200 cents = EUR 92.00
    expect(convertMinorUnits(10000, 'USD', 'EUR')).toBe(9200);
  });

  it('should convert USD to JPY dropping the cents scale', () => {
    // $100.00 -> 10000 cents; 100 * 150 = 15000 yen
    expect(convertMinorUnits(10000, 'USD', 'JPY')).toBe(15000);
  });

  it('should convert through USD when neither side is USD', () => {
    // EUR 100.00 -> 100/0.92 = $108.6956...; * 150 = 16304.3478 yen -> floor 16304
    expect(convertMinorUnits(10000, 'EUR', 'JPY')).toBe(16304);
  });

  it('should floor rather than round a fractional remainder', () => {
    // JPY 100 -> 100/150 = $0.66666...; * 100 = 66.66 cents -> floor 66
    expect(convertMinorUnits(100, 'JPY', 'USD')).toBe(66);
  });

  it('should not lose a unit to floating point on an exact conversion', () => {
    // 0.92 is not exactly representable in binary floating point; the result is
    // exactly 92000 cents and must not floor down to 91999.
    expect(convertMinorUnits(100000, 'USD', 'EUR')).toBe(92000);
  });

  it('should return zero when the converted amount is below one minor unit', () => {
    // 1 yen -> $0.0066 -> 0 cents
    expect(convertMinorUnits(1, 'JPY', 'USD')).toBe(0);
  });

  it('should round-trip approximately back to the original currency', () => {
    const there = convertMinorUnits(10000, 'USD', 'GBP');
    const back = convertMinorUnits(there, 'GBP', 'USD');

    // Flooring loses at most a minor unit in each direction.
    expect(back).toBeLessThanOrEqual(10000);
    expect(back).toBeGreaterThan(9998);
  });
});
