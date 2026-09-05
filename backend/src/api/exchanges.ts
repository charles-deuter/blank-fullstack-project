import express, { RequestHandler, Request } from 'express';
import * as exchangeDal from '../database/dal/exchange';
import { performExchange, InsufficientBalanceError } from '../services/exchange';
import { CURRENCY_CODES, CurrencyCode } from '../constants/currencies';

const exchangesRouter = express.Router();

const getExchanges: RequestHandler = async (_req, res, next) => {
  try {
    const records = await exchangeDal.findAll();
    res.status(200).json(records);
  } catch (err) {
    next(err);
  }
};

interface ExchangeBody {
  from_currency: any;
  to_currency: any;
  amount: any;
}

function isValidCurrency(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && CURRENCY_CODES.includes(value as CurrencyCode);
}

const createExchange: RequestHandler = async (
  req: Request<{}, {}, ExchangeBody>,
  res,
  next,
) => {
  try {
    const { from_currency, to_currency, amount } = req.body ?? {};

    if (!isValidCurrency(from_currency)) {
      return res
        .status(400)
        .json({ message: 'from_currency must be a valid currency code' });
    }
    if (!isValidCurrency(to_currency)) {
      return res
        .status(400)
        .json({ message: 'to_currency must be a valid currency code' });
    }
    if (from_currency === to_currency) {
      return res
        .status(400)
        .json({ message: 'from_currency and to_currency must be different' });
    }
    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ message: 'amount must be a positive integer' });
    }

    const record = await performExchange(from_currency, to_currency, amount);
    res.status(201).json(record);
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

exchangesRouter.get('/', getExchanges);
exchangesRouter.post('/', createExchange);

export default exchangesRouter;
