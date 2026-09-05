import { db } from '../database/db';
import * as walletBalanceDal from '../database/dal/wallet-balance';
import * as exchangeDal from '../database/dal/exchange';
import {
  getRate,
  toWholeUnit,
  toSmallestUnit,
  CURRENCIES,
  CurrencyCode,
} from '../constants/currencies';

export class InsufficientBalanceError extends Error {
  constructor(currency: string, available: number, requested: number) {
    super(`Insufficient ${currency} balance: have ${available}, need ${requested}`);
    this.name = 'InsufficientBalanceError';
  }
}

export async function performExchange(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  sourceAmount: number,
) {
  return db.transaction(async (trx) => {
    const [first, second] = [fromCurrency, toCurrency].sort();
    const firstRow = await walletBalanceDal.findByCurrencyForUpdate(first, trx);
    const secondRow = await walletBalanceDal.findByCurrencyForUpdate(second, trx);

    const fromRow = first === fromCurrency ? firstRow : secondRow;
    const toRow = first === toCurrency ? firstRow : secondRow;

    if (!fromRow || !toRow) {
      throw new Error('Wallet balance row not found');
    }

    if (fromRow.amount < sourceAmount) {
      throw new InsufficientBalanceError(fromCurrency, fromRow.amount, sourceAmount);
    }

    const wholeSource = toWholeUnit(sourceAmount, fromCurrency);
    const rate = getRate(fromCurrency, toCurrency);
    const wholeTarget = wholeSource * rate;
    const targetAmount = toSmallestUnit(wholeTarget, toCurrency);

    await walletBalanceDal.updateAmount(fromRow.id, fromRow.amount - sourceAmount, trx);
    await walletBalanceDal.updateAmount(toRow.id, toRow.amount + targetAmount, trx);

    const record = await exchangeDal.create(
      {
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: sourceAmount,
        to_amount: targetAmount,
        rate_used: rate.toFixed(6),
      },
      trx,
    );

    return record;
  });
}
