'use strict';

const { z } = require('zod');

const registerSchema = z.object({
  uid: z.string().min(1, 'UID este obligatoriu.'),
  firstName: z.string().min(1, 'Prenumele este obligatoriu.'),
  lastName: z.string().min(1, 'Numele este obligatoriu.'),
  email: z.string().email('Email invalid.'),
  phone: z.string().min(6, 'Numărul de telefon este prea scurt.'),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

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

module.exports = { registerSchema, updateProfileSchema };
