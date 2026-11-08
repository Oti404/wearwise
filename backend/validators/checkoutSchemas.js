'use strict';

const { z } = require('zod');

const checkoutSchema = z.object({
  items: z
    .array(z.string().uuid('Invalid item ID.'))
    .min(1, 'The item list cannot be empty.')
    // Bounded arrays keep validation cheap (zod 3 can exhaust memory on huge inputs).
    .max(50, 'A cart can hold at most 50 items.'),
});

const relistSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required.'),
  updates: z
    .object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().positive().optional().nullable(),
      mode: z.enum(['sell']).optional(),
    })
    .optional(),
});

module.exports = { checkoutSchema, relistSchema };
