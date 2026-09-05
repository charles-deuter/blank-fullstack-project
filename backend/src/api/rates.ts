import express, { RequestHandler } from 'express';
import { RATES_TO_USD, CURRENCIES } from '../constants/currencies';

const ratesRouter = express.Router();

const getRates: RequestHandler = (_req, res) => {
  res.status(200).json({ rates: RATES_TO_USD, currencies: CURRENCIES });
};

ratesRouter.get('/', getRates);

export default ratesRouter;
