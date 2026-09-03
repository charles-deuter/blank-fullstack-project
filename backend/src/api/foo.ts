import express, { RequestHandler, Request } from 'express';
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

interface CreateFooBody {
  name: any;
}

const createFooController: RequestHandler = async (
  req: Request<{}, {}, CreateFooBody>,
  res,
  next,
) => {
  try {
    const { name } = req.body ?? {};

    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        message: 'name is required and must be a non-empty string',
      });
    }

    const created = await foo.create(name.trim());

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

fooRouter.get('/', fooController);
fooRouter.post('/', createFooController);

export default fooRouter;
