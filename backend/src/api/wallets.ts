import express, { RequestHandler } from 'express';
import * as walletDal from '../database/dal/wallet';
import * as transactionDal from '../database/dal/transaction';
import {
  CURRENCIES,
  CURRENCY_DECIMALS,
  convert,
  effectiveRate,
  isCurrency,
  toUsdCents,
} from '../constants/currencies';

const walletsRouter = express.Router();

function parseWalletId(raw: string): number | null {
  const id = Number(raw);

  return Number.isInteger(id) && id > 0 ? id : null;
}

const getWalletController: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const walletId = parseWalletId(req.params.id);

    if (walletId === null) {
      return res.status(400).json({ message: 'wallet id must be a positive integer' });
    }

    const wallet = await walletDal.findById(walletId);

    if (!wallet) {
      return res.status(404).json({ message: `wallet ${walletId} not found` });
    }

    const stored = await walletDal.findBalances(walletId);
    const amountByCurrency = new Map(stored.map((row) => [row.currency, row.amount]));

    // Driven off CURRENCIES rather than the stored rows so the wallet always
    // reports every supported currency in a stable order.
    const balances = CURRENCIES.map((currency) => {
      const amount = amountByCurrency.get(currency) ?? 0;

      return {
        currency,
        amount,
        decimals: CURRENCY_DECIMALS[currency],
        usdEquivalent: toUsdCents(amount, currency),
      };
    });

    const totalUsd = balances.reduce((sum, balance) => sum + balance.usdEquivalent, 0);

    res.status(200).json({ id: wallet.id, balances, totalUsd });
  } catch (err) {
    next(err);
  }
};

const listTransactionsController: RequestHandler<{ id: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const walletId = parseWalletId(req.params.id);

    if (walletId === null) {
      return res.status(400).json({ message: 'wallet id must be a positive integer' });
    }

    const wallet = await walletDal.findById(walletId);

    if (!wallet) {
      return res.status(404).json({ message: `wallet ${walletId} not found` });
    }

    res.status(200).json(await transactionDal.findAllForWallet(walletId));
  } catch (err) {
    next(err);
  }
};

interface CreateTransactionBody {
  fromCurrency: any;
  toCurrency: any;
  fromAmount: any;
}

const createTransactionController: RequestHandler<
  { id: string },
  any,
  CreateTransactionBody
> = async (req, res, next) => {
  try {
    const walletId = parseWalletId(req.params.id);

    if (walletId === null) {
      return res.status(400).json({ message: 'wallet id must be a positive integer' });
    }

    const { fromCurrency, toCurrency, fromAmount } = req.body ?? {};

    if (!isCurrency(fromCurrency)) {
      return res.status(400).json({
        message: `fromCurrency must be one of ${CURRENCIES.join(', ')}`,
      });
    }

    if (!isCurrency(toCurrency)) {
      return res.status(400).json({
        message: `toCurrency must be one of ${CURRENCIES.join(', ')}`,
      });
    }

    if (fromCurrency === toCurrency) {
      return res.status(400).json({ message: 'fromCurrency and toCurrency must differ' });
    }

    if (
      typeof fromAmount !== 'number' ||
      !Number.isInteger(fromAmount) ||
      fromAmount <= 0
    ) {
      return res.status(400).json({
        message: 'fromAmount must be a positive integer in the currency smallest unit',
      });
    }

    const wallet = await walletDal.findById(walletId);

    if (!wallet) {
      return res.status(404).json({ message: `wallet ${walletId} not found` });
    }

    const toAmount = convert(fromAmount, fromCurrency, toCurrency);

    if (toAmount <= 0) {
      return res.status(400).json({
        message: `exchanging that amount of ${fromCurrency} rounds down to zero ${toCurrency}`,
      });
    }

    const created = await transactionDal.createExchange({
      walletId,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
      exchangeRate: effectiveRate(fromCurrency, toCurrency),
    });

    if (!created) {
      return res.status(400).json({ message: `insufficient ${fromCurrency} balance` });
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

walletsRouter.get('/:id', getWalletController);
walletsRouter.get('/:id/transactions', listTransactionsController);
walletsRouter.post('/:id/transactions', createTransactionController);

export default walletsRouter;
