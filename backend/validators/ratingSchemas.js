'use strict';

const { z } = require('zod');

const submitRatingSchema = z.object({
  raterId: z.string().min(1, 'raterId este obligatoriu.'),
  targetUserId: z.string().min(1, 'targetUserId este obligatoriu.'),
  itemId: z.string().optional(),
  rating: z
    .number()
    .min(1, 'Rating-ul minim este 1.')
    .max(5, 'Rating-ul maxim este 5.'),
  comment: z.string().max(500).optional().default(''),
  notificationId: z.string().optional(),
});

module.exports = { submitRatingSchema };
