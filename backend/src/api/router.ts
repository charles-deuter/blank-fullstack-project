import express from 'express';
import foo from './foo';
import wallets from './wallets';
import exchangeRate from './exchange-rate';

const router = express.Router();

router.use('/foo', foo);
router.use('/wallets', wallets);
router.use('/exchange-rate', exchangeRate);

export default router;
