import express, { RequestHandler } from 'express';
import * as walletBalanceDal from '../database/dal/wallet-balance';

const walletRouter = express.Router();

const getBalances: RequestHandler = async (_req, res, next) => {
  try {
    const balances = await walletBalanceDal.findAll();
    res.status(200).json(balances);
  } catch (err) {
    next(err);
  }
};

walletRouter.get('/', getBalances);

export default walletRouter;
