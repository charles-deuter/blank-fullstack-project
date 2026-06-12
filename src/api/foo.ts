import express, { RequestHandler } from 'express';
import * as foo from '../database/dal/foo';

const fooRouter = express.Router();

const fooController: RequestHandler = async (req, res, next) => {
  try {
    const result = await foo.findALL();

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

fooRouter.get('/', fooController);

export default fooRouter;
