import express, { RequestHandler } from 'express';
import { BASE_CURRENCY, CURRENCIES } from '../domain/currency';

const ratesRouter = express.Router();

const ratesController: RequestHandler = (req, res) => {
  res.status(200).json({ base: BASE_CURRENCY, currencies: CURRENCIES });
};

ratesRouter.get('/', ratesController);

export default ratesRouter;
