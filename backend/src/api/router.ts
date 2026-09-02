import express from 'express';
import foo from './foo';
import transaction from './transaction';
import wallet from './wallet';

const router = express.Router();

router.use('/foo', foo);
router.use('/wallets', wallet);
router.use('/transactions', transaction);

export default router;
