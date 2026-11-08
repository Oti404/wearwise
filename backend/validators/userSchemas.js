'use strict';

const { z } = require('zod');

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
}).strict();

module.exports = { updateProfileSchema };
