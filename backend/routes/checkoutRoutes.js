'use strict';

const router = require('express').Router();
const checkoutController = require('../controllers/checkoutController');
const verifyToken = require('../middlewares/verifyToken');
const validate = require('../middlewares/validate');
const { checkoutSchema, relistSchema } = require('../validators/checkoutSchemas');

// POST /checkout – protected
router.post('/checkout', verifyToken, validate(checkoutSchema), checkoutController.checkout);

// POST /re-list – protected
router.post('/re-list', verifyToken, validate(relistSchema), checkoutController.relist);

module.exports = router;
