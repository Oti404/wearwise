'use strict';

const { z } = require('zod');

const MODE_ENUM = z.enum(['trade', 'sell', 'both', 'donate']);

const createClothesSchema = z
  .object({
    name: z.string().min(1, 'Numele articolului este obligatoriu.'),
    description: z.string().optional().default(''),
    images: z.array(z.string()).optional().default([]),
    category: z.string().optional().default('others'),
    size: z.string().optional().default('N/A'),
    condition: z.string().optional().default('good'),
    mode: MODE_ENUM,
    price: z.number().positive('Prețul trebuie să fie pozitiv.').optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.mode === 'sell' || data.mode === 'both') {
        return data.price != null && data.price > 0;
      }
      return true;
    },
    { message: 'Prețul este obligatoriu pentru modul de vânzare.', path: ['price'] }
  );

module.exports = { createClothesSchema };
