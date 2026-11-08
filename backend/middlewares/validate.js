'use strict';

/**
 * validate – Zod schema validation middleware factory.
 *
 * Usage: router.post('/path', validate(myZodSchema), controller)
 *
 * Validates req.body against the provided Zod schema.
 * On failure, returns 400 with structured error details.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      status: 'error',
      message: 'Invalid data.',
      errors,
    });
  }

  // Attach parsed (and potentially transformed) data back to req.body
  req.body = result.data;
  next();
};

module.exports = validate;
