import express, { Request, RequestHandler } from 'express';
import { db } from '../database/db';
import * as transactionDal from '../database/dal/transaction';
import * as transactionErrorDal from '../database/dal/transaction-error';
import * as walletDal from '../database/dal/wallet';
import { TransferFailureReason } from '../database/models/transaction-error';

const transactionRouter = express.Router();

// One vocabulary, used for both the persisted `reason` and the HTTP status.
const FAILURE_STATUS: Record<TransferFailureReason, number> = {
  INVALID_AMOUNT: 400,
  SELF_TRANSFER: 400,
  SENDER_NOT_FOUND: 404,
  RECIPIENT_NOT_FOUND: 404,
  INSUFFICIENT_FUNDS: 422,
};

const FAILURE_MESSAGE: Record<TransferFailureReason, string> = {
  INVALID_AMOUNT: 'amount_cents is required and must be a positive integer',
  SELF_TRANSFER: 'sender_wallet_id and recipient_wallet_id must be different wallets',
  SENDER_NOT_FOUND: 'sender wallet not found',
  RECIPIENT_NOT_FOUND: 'recipient wallet not found',
  INSUFFICIENT_FUNDS: 'sender has insufficient funds',
};

/**
 * A rejected transfer, as opposed to a genuine fault. Thrown inside the transaction
 * to force a rollback, then caught outside it. Anything that is NOT this is rethrown
 * to the error handler in app.ts, which still produces a 500.
 */
class TransferRejected extends Error {
  constructor(readonly reason: TransferFailureReason) {
    super(reason);
    this.name = 'TransferRejected';
  }
}

function toWalletId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function toAmountCents(value: unknown): number | null {
  // Money is integer cents. 12.5 is not a valid number of cents, and neither is a
  // string, however numeric it looks.
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

const listTransactionsController: RequestHandler = async (req, res, next) => {
  try {
    const result = await transactionDal.findAll();

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

interface CreateTransactionBody {
  sender_wallet_id: any;
  recipient_wallet_id: any;
  amount_cents: any;
}

const createTransactionController: RequestHandler = async (
  req: Request<{}, {}, CreateTransactionBody>,
  res,
  next,
) => {
  const body = req.body ?? {};
  const senderId = toWalletId(body.sender_wallet_id);
  const recipientId = toWalletId(body.recipient_wallet_id);
  const amountCents = toAmountCents(body.amount_cents);

  try {
    // Phase 1 — decidable without touching the database, so no transaction is opened.
    // A malformed id identifies no wallet, so it lands on the same *_NOT_FOUND reason
    // as an id that simply does not exist.
    if (amountCents === null) throw new TransferRejected('INVALID_AMOUNT');
    if (senderId === null) throw new TransferRejected('SENDER_NOT_FOUND');
    if (recipientId === null) throw new TransferRejected('RECIPIENT_NOT_FOUND');
    if (senderId === recipientId) throw new TransferRejected('SELF_TRANSFER');

    // Phase 2 — the atomic transfer. The route owns this boundary rather than the
    // DAL because the lock has to span read, check and write. See docs/adr/0001.
    const created = await db.transaction(async (tx) => {
      // Locks both rows in ascending id order and holds them until commit.
      const locked = await walletDal.lockPair(senderId, recipientId, tx);
      const sender = locked.find((wallet) => wallet.id === senderId);
      const recipient = locked.find((wallet) => wallet.id === recipientId);

      if (!sender) throw new TransferRejected('SENDER_NOT_FOUND');
      if (!recipient) throw new TransferRejected('RECIPIENT_NOT_FOUND');
      if (sender.balance_cents < amountCents) {
        throw new TransferRejected('INSUFFICIENT_FUNDS');
      }

      const debited = await walletDal.debit(senderId, amountCents, tx);

      // Unreachable while the lock is held — the guard in the UPDATE and the check
      // above cannot disagree. Kept so a future refactor that drops the lock fails
      // loudly instead of overdrawing silently.
      if (!debited) throw new TransferRejected('INSUFFICIENT_FUNDS');

      await walletDal.credit(recipientId, amountCents, tx);

      return transactionDal.create(
        {
          sender_wallet_id: senderId,
          recipient_wallet_id: recipientId,
          amount_cents: amountCents,
        },
        tx,
      );
    });

    return res.status(201).json(created);
  } catch (err) {
    if (!(err instanceof TransferRejected)) return next(err);

    // The transfer transaction has already rolled back, so nothing was written and
    // `tx` no longer exists. Log on the pooled connection instead. This write is
    // deliberately outside any transaction, and therefore best-effort.
    await transactionErrorDal.record({
      sender_wallet_id: senderId,
      recipient_wallet_id: recipientId,
      amount_cents: amountCents,
      reason: err.reason,
    });

    return res.status(FAILURE_STATUS[err.reason]).json({
      message: FAILURE_MESSAGE[err.reason],
    });
  }
};

transactionRouter.get('/', listTransactionsController);
transactionRouter.post('/', createTransactionController);

export default transactionRouter;
