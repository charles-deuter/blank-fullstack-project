import express from 'express';
import foo from './foo';
import wallet from './wallet';
import rates from './rates';
import exchanges from './exchanges';

const router = express.Router();

router.use('/foo', foo);
router.use('/wallet', wallet);
router.use('/rates', rates);
router.use('/exchanges', exchanges);

export default router;
