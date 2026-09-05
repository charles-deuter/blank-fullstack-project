import express, { RequestHandler } from 'express';
import * as exchange from '../database/dal/exchange';
import * as wallet from '../database/dal/wallet';
import { ExchangeSelectType } from '../database/models/exchange';
import {
  convert,
  CURRENCIES,
  CURRENCY_CODES,
  CurrencyCode,
  formatRateUsd,
  isCurrencyCode,
  rateUsdNumeric,
  usdMinorValue,
} from '../services/currency';

const walletsRouter = express.Router();

// Path params are typed string, per CLAUDE.md, and validated at runtime.
interface WalletParams {
  walletId: string;
}

const WALLET_ID_MESSAGE = 'walletId must be a positive integer';

function parseWalletId(walletId: string): number | null {
  return /^[1-9][0-9]*$/.test(walletId) ? Number(walletId) : null;
}

// Unknown codes sort last so a row written outside the constants file is still
// rendered rather than silently dropped.
function currencyRank(currency: string): number {
  const rank = CURRENCY_CODES.indexOf(currency as CurrencyCode);

  return rank === -1 ? CURRENCY_CODES.length : rank;
}

const RATES = Object.fromEntries(
  CURRENCY_CODES.map((currency) => [currency, formatRateUsd(currency)]),
);

const getWalletController: RequestHandler<WalletParams> = async (req, res, next) => {
  try {
    const walletId = parseWalletId(req.params.walletId);

    if (walletId === null) {
      return res.status(400).json({ success: false, message: WALLET_ID_MESSAGE });
    }

    const found = await wallet.findWallet(walletId);

    if (!found) {
      return res.status(404).json({ success: false, message: 'wallet not found' });
    }

    const rows = await wallet.findBalances(walletId);
    const ordered = [...rows].sort(
      (a, b) => currencyRank(a.currency) - currencyRank(b.currency),
    );

    let totalUsd = 0n;
    const balances = ordered.map((row) => {
      // A row whose currency left the constants file has no rate and no
      // exponent to render; it contributes nothing to the total.
      const currency = row.currency;
      const usdValue = isCurrencyCode(currency)
        ? usdMinorValue(row.amount, currency)
        : 0n;
      totalUsd += usdValue;

      return {
        currency,
        amount: row.amount.toString(),
        exponent: isCurrencyCode(currency) ? CURRENCIES[currency].exponent : 0,
        usdValue: usdValue.toString(),
      };
    });

    res.status(200).json({
      id: found.id,
      name: found.name,
      balances,
      totalUsd: totalUsd.toString(),
      // Rates are constants, not state, so they ride along here rather than
      // getting an endpoint of their own.
      rates: RATES,
    });
  } catch (err) {
    next(err);
  }
};

// Request bodies are typed `any` and checked at runtime, per CLAUDE.md: the
// compile-time type would be a lie about untrusted input.
interface CreateExchangeBody {
  fromCurrency: any;
  toCurrency: any;
  amount: any;
}

const AMOUNT_MESSAGE = 'amount must be a positive integer string';

function parseAmount(amount: any): bigint | null {
  return typeof amount === 'string' && /^[1-9][0-9]*$/.test(amount)
    ? BigInt(amount)
    : null;
}

function serializeExchange(row: ExchangeSelectType) {
  return {
    id: row.id,
    fromCurrency: row.from_currency,
    toCurrency: row.to_currency,
    fromAmount: row.from_amount.toString(),
    toAmount: row.to_amount.toString(),
    fromRateUsd: row.from_rate_usd,
    toRateUsd: row.to_rate_usd,
    createdAt: row.created_at.toISOString(),
  };
}

const createExchangeController: RequestHandler<
  WalletParams,
  unknown,
  CreateExchangeBody
> = async (req, res, next) => {
  try {
    const walletId = parseWalletId(req.params.walletId);

    if (walletId === null) {
      return res.status(400).json({ success: false, message: WALLET_ID_MESSAGE });
    }

    const { fromCurrency, toCurrency, amount } = req.body ?? {};

    if (!isCurrencyCode(fromCurrency) || !isCurrencyCode(toCurrency)) {
      return res.status(400).json({ success: false, message: 'unknown currency' });
    }

    if (fromCurrency === toCurrency) {
      return res
        .status(400)
        .json({ success: false, message: 'cannot exchange a currency for itself' });
    }

    const fromAmount = parseAmount(amount);

    if (fromAmount === null) {
      return res.status(400).json({ success: false, message: AMOUNT_MESSAGE });
    }

    if (!(await wallet.findWallet(walletId))) {
      return res.status(404).json({ success: false, message: 'wallet not found' });
    }

    const toAmount = convert(fromAmount, fromCurrency, toCurrency);

    // The dust guard. Flooring is what makes it possible: ¥1 into GBP rounds
    // down to nothing, and allowing it would debit the wallet and credit zero.
    // It depends only on the amount and the rates, so it is settled here rather
    // than inside the transaction.
    if (toAmount === 0n) {
      return res
        .status(400)
        .json({ success: false, message: 'amount too small to exchange' });
    }

    const outcome = await exchange.executeExchange({
      wallet_id: walletId,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      from_amount: fromAmount,
      to_amount: toAmount,
      from_rate_usd: rateUsdNumeric(fromCurrency),
      to_rate_usd: rateUsdNumeric(toCurrency),
    });

    if (outcome.status === 'insufficient-funds') {
      return res.status(400).json({ success: false, message: 'insufficient funds' });
    }

    // The updated balances are deliberately not returned; the client re-reads
    // the wallet so the server stays the single source of truth for them.
    res.status(201).json(serializeExchange(outcome.exchange));
  } catch (err) {
    next(err);
  }
};

const listExchangesController: RequestHandler<WalletParams> = async (req, res, next) => {
  try {
    const walletId = parseWalletId(req.params.walletId);

    if (walletId === null) {
      return res.status(400).json({ success: false, message: WALLET_ID_MESSAGE });
    }

    if (!(await wallet.findWallet(walletId))) {
      return res.status(404).json({ success: false, message: 'wallet not found' });
    }

    const rows = await exchange.findExchanges(walletId);

    res.status(200).json(rows.map(serializeExchange));
  } catch (err) {
    next(err);
  }
};

walletsRouter.get('/:walletId', getWalletController);
walletsRouter.get('/:walletId/exchanges', listExchangesController);
walletsRouter.post('/:walletId/exchanges', createExchangeController);

export default walletsRouter;
