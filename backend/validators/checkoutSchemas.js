'use strict';

const { z } = require('zod');

const checkoutSchema = z.object({
  items: z
    .array(z.string().min(1))
    .min(1, 'Lista de articole nu poate fi goală.'),
});

const relistSchema = z.object({
  itemId: z.string().min(1, 'ID-ul articolului este obligatoriu.'),
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
