import express, { RequestHandler } from 'express';
import { CURRENCIES, convert, effectiveRate, isCurrency } from '../constants/currencies';

const exchangeRateRouter = express.Router();

interface ExchangeRateQuery {
  from: string;
  to: string;
  amount: string;
}

const exchangeRateController: RequestHandler<{}, any, any, ExchangeRateQuery> = async (
  req,
  res,
  next,
) => {
  try {
    const { from, to, amount } = req.query;

    if (!isCurrency(from)) {
      return res
        .status(400)
        .json({ message: `from must be one of ${CURRENCIES.join(', ')}` });
    }

    if (!isCurrency(to)) {
      return res
        .status(400)
        .json({ message: `to must be one of ${CURRENCIES.join(', ')}` });
    }

    if (from === to) {
      return res.status(400).json({ message: 'from and to must differ' });
    }

    const fromAmount = Number(amount);

    if (!Number.isInteger(fromAmount) || fromAmount <= 0) {
      return res.status(400).json({
        message: 'amount must be a positive integer in the currency smallest unit',
      });
    }

    res.status(200).json({
      fromAmount,
      toAmount: convert(fromAmount, from, to),
      rate: effectiveRate(from, to),
    });
  } catch (err) {
    next(err);
  }
};

exchangeRateRouter.get('/', exchangeRateController);

export default exchangeRateRouter;
