import express, { RequestHandler } from 'express';
import * as wallets from '../database/dal/wallet';
import { isCurrency, toMinorUnits } from '../domain/currency';

const walletsRouter = express.Router();

interface WalletParams {
  id: string;
}

interface ExchangeBody {
  from_currency: any;
  to_currency: any;
  from_amount: any;
}

const resolveWallet: RequestHandler<WalletParams> = async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({ message: 'wallet id must be a positive integer' });
    }

    if (!(await wallets.exists(Number(req.params.id)))) {
      return res.status(404).json({ message: 'wallet not found' });
    }

    next();
  } catch (err) {
    next(err);
  }
};

const balancesController: RequestHandler<WalletParams> = async (req, res, next) => {
  try {
    res.status(200).json(await wallets.findBalances(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

const transactionsController: RequestHandler<WalletParams> = async (req, res, next) => {
  try {
    res.status(200).json(await wallets.findTransactions(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

const exchangeController: RequestHandler<WalletParams, {}, ExchangeBody> = async (
  req,
  res,
  next,
) => {
  try {
    const { from_currency, to_currency, from_amount } = req.body ?? {};

    if (!isCurrency(from_currency)) {
      return res
        .status(400)
        .json({ message: 'from_currency must be a supported currency code' });
    }

    if (!isCurrency(to_currency)) {
      return res
        .status(400)
        .json({ message: 'to_currency must be a supported currency code' });
    }

    if (from_currency === to_currency) {
      return res
        .status(400)
        .json({ message: 'from_currency and to_currency must differ' });
    }

    if (
      typeof from_amount !== 'number' ||
      !Number.isFinite(from_amount) ||
      from_amount <= 0
    ) {
      return res.status(400).json({ message: 'from_amount must be a positive number' });
    }

    const fromMinorUnits = toMinorUnits(from_amount, from_currency);

    if (fromMinorUnits <= 0) {
      return res.status(400).json({
        message: `from_amount is smaller than the smallest ${from_currency} unit`,
      });
    }

    const result = await wallets.createExchange(
      Number(req.params.id),
      from_currency,
      to_currency,
      fromMinorUnits,
    );

    if (!result.ok) {
      return res.status(400).json({ message: `insufficient ${from_currency} balance` });
    }

    res.status(201).json(result.transaction);
  } catch (err) {
    next(err);
  }
};

walletsRouter.get('/:id/balances', resolveWallet, balancesController);
walletsRouter.get('/:id/transactions', resolveWallet, transactionsController);
walletsRouter.post('/:id/exchange', resolveWallet, exchangeController);

export default walletsRouter;
