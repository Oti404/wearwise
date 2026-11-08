'use strict';

const { z } = require('zod');

// bcrypt only uses the first 72 bytes of a password; reject longer ones instead of silently truncating.
const password = z.string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.');

const registerSchema = z.object({
  email: z.string().trim().email('Invalid email.'),
  password,
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  phone: z.string().trim().min(6, 'Phone number is too short.'),
  city: z.string().trim().optional(),
});

// `identifier` is an email address or a phone number.
const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or phone number is required.'),
  password: z.string().min(1, 'Password is required.'),
});

module.exports = { registerSchema, loginSchema };
