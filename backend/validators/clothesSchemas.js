'use strict';

const { z } = require('zod');

const MODE_ENUM = z.enum(['sell']);

const createClothesSchema = z.object({
    name: z.string().min(1, 'Item name is required.'),
    description: z.string().optional().default(''),
    images: z.array(z.string().url()).max(10, 'A listing can have at most 10 images.').optional().default([]),
    category: z.string().optional().default('others'),
    size: z.string().optional().default('N/A'),
    condition: z.string().optional().default('good'),
    mode: MODE_ENUM,
    price: z.number().positive('Price must be positive.'),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
  });

module.exports = { createClothesSchema };
