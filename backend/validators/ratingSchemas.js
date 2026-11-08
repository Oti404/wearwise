'use strict';

const { z } = require('zod');

// Rater, seller and item are never taken from the client: they come from the token and
// from the purchase's rating-request notification.
const submitRatingSchema = z.object({
  notificationId: z.string().uuid('A valid rating request is required.'),
  rating: z
    .number()
    .min(1, 'The minimum rating is 1.')
    .max(5, 'The maximum rating is 5.'),
  comment: z.string().max(500).optional().default(''),
});

module.exports = { submitRatingSchema };
