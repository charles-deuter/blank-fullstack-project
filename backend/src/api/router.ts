import express from 'express';
import foo from './foo';
import rates from './rates';
import wallets from './wallets';

const router = express.Router();

router.use('/foo', foo);
router.use('/rates', rates);
router.use('/wallets', wallets);

export default router;
