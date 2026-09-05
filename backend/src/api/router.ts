import express from 'express';
import foo from './foo';
import wallets from './wallets';

const router = express.Router();

router.use('/foo', foo);
router.use('/wallets', wallets);

export default router;
