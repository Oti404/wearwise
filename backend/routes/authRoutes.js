'use strict';

const router = require('express').Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/verifyToken');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/authSchemas');
const { writeLimiter } = require('../config/rateLimit');

// Strict limiter on both public endpoints slows down password guessing and sign-up spam.
router.post('/register', writeLimiter, validate(registerSchema), authController.register);
router.post('/login', writeLimiter, validate(loginSchema), authController.login);
router.get('/me', verifyToken, authController.me);

module.exports = router;
