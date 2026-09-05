import { toSmallestUnit, toWholeUnit, getRate } from '../src/constants/currencies';

describe('toSmallestUnit', () => {
  it('should convert 10.50 USD to 1050 cents', () => {
    expect(toSmallestUnit(10.5, 'USD')).toBe(1050);
  });

  it('should convert 100 JPY to 100 (no subunit)', () => {
    expect(toSmallestUnit(100, 'JPY')).toBe(100);
  });

  it('should convert 5.99 EUR to 599 cents', () => {
    expect(toSmallestUnit(5.99, 'EUR')).toBe(599);
  });
});

describe('toWholeUnit', () => {
  it('should convert 1050 USD cents to 10.50', () => {
    expect(toWholeUnit(1050, 'USD')).toBe(10.5);
  });

  it('should convert 100 JPY to 100 (no subunit)', () => {
    expect(toWholeUnit(100, 'JPY')).toBe(100);
  });

  it('should convert 599 EUR cents to 5.99', () => {
    expect(toWholeUnit(599, 'EUR')).toBe(5.99);
  });
});

describe('getRate', () => {
  it('should return 1 for same currency', () => {
    expect(getRate('USD', 'USD')).toBe(1);
  });

  it('should return the direct rate for USD to another currency', () => {
    expect(getRate('USD', 'JPY')).toBe(149.5);
  });

  it('should return the inverse rate for another currency to USD', () => {
    expect(getRate('JPY', 'USD')).toBeCloseTo(1 / 149.5, 10);
  });

  it('should derive a cross-rate for non-USD pairs', () => {
    const jpyToEur = getRate('JPY', 'EUR');
    const expected = 0.92 / 149.5;
    expect(jpyToEur).toBeCloseTo(expected, 10);
  });
});
