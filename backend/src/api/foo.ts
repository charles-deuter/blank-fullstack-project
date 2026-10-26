import express, { RequestHandler, Request } from 'express';
import * as foo from '../database/dal/foo';

const fooRouter = express.Router();

const FOO_CATEGORIES = ['general', 'internal', 'external'] as const;
const FOO_PRIORITIES = ['low', 'medium', 'high'] as const;
const DESCRIPTION_MAX_LENGTH = 500;

const ERRORS = {
  NAME_INVALID: {
    code: 'FOO_NAME_INVALID',
    message: 'name is required and must be a non-empty string',
  },
  DESCRIPTION_INVALID: {
    code: 'FOO_DESCRIPTION_INVALID',
    message: 'description must be a string of at most 500 characters',
  },
  CATEGORY_INVALID: {
    code: 'FOO_CATEGORY_INVALID',
    message: 'category is required and must be one of general, internal, external',
  },
  PRIORITY_INVALID: {
    code: 'FOO_PRIORITY_INVALID',
    message: 'priority is required and must be one of low, medium, high',
  },
  IS_ACTIVE_INVALID: {
    code: 'FOO_IS_ACTIVE_INVALID',
    message: 'is_active is required and must be a boolean',
  },
} as const;

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
  description: any;
  category: any;
  priority: any;
  is_active: any;
}

const createFooController: RequestHandler = async (
  req: Request<{}, {}, CreateFooBody>,
  res,
  next,
) => {
  try {
    const { name, description, category, priority, is_active } = req.body ?? {};

    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json(ERRORS.NAME_INVALID);
    }

    // Omitted, null, and blank all mean "no description" and are stored as null.
    const isDescriptionAbsent = description === undefined || description === null;
    if (!isDescriptionAbsent && typeof description !== 'string') {
      return res.status(400).json(ERRORS.DESCRIPTION_INVALID);
    }
    const trimmedDescription = isDescriptionAbsent ? '' : description.trim();
    if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
      return res.status(400).json(ERRORS.DESCRIPTION_INVALID);
    }

    if (!FOO_CATEGORIES.includes(category)) {
      return res.status(400).json(ERRORS.CATEGORY_INVALID);
    }

    if (!FOO_PRIORITIES.includes(priority)) {
      return res.status(400).json(ERRORS.PRIORITY_INVALID);
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json(ERRORS.IS_ACTIVE_INVALID);
    }

    const isDescriptionBlank = trimmedDescription === '';
    const created = await foo.create({
      name: name.trim(),
      description: isDescriptionBlank ? null : trimmedDescription,
      category,
      priority,
      is_active,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

fooRouter.get('/', fooController);
fooRouter.post('/', createFooController);

export default fooRouter;
