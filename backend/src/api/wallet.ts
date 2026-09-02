import express, { RequestHandler } from 'express';
import * as transactionDal from '../database/dal/transaction';
import * as walletDal from '../database/dal/wallet';

const walletRouter = express.Router();

// Express 5 types a route param as string | string[]; a repeated :id is not a
// wallet id, so anything that is not a single numeric string resolves to null.
function toWalletId(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;

  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

const listWalletsController: RequestHandler = async (req, res, next) => {
  try {
    const result = await walletDal.findAll();

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getWalletController: RequestHandler = async (req, res, next) => {
  try {
    const id = toWalletId(req.params.id);

    if (id === null) {
      return res.status(404).json({ message: 'wallet not found' });
    }

    const wallet = await walletDal.findById(id);

    if (!wallet) {
      return res.status(404).json({ message: 'wallet not found' });
    }

    res.status(200).json(wallet);
  } catch (err) {
    next(err);
  }
};

const getWalletTransactionsController: RequestHandler = async (req, res, next) => {
  try {
    const id = toWalletId(req.params.id);

    if (id === null) {
      return res.status(404).json({ message: 'wallet not found' });
    }

    // A wallet with no history and a wallet that does not exist are different
    // answers, so the existence check is not optional.
    const wallet = await walletDal.findById(id);

    if (!wallet) {
      return res.status(404).json({ message: 'wallet not found' });
    }

    const result = await transactionDal.findByWalletId(id);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

walletRouter.get('/', listWalletsController);
walletRouter.get('/:id', getWalletController);
walletRouter.get('/:id/transactions', getWalletTransactionsController);

export default walletRouter;
