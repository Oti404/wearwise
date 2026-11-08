'use strict';

const router = require('express').Router();
const ratingController = require('../controllers/ratingController');
const validate = require('../middlewares/validate');
const verifyToken = require('../middlewares/verifyToken');
const { writeLimiter } = require('../config/rateLimit');
const { submitRatingSchema } = require('../validators/ratingSchemas');

// POST /ratings – protected: only a buyer answering their own rating request can rate
router.post('/ratings', verifyToken, writeLimiter, validate(submitRatingSchema), ratingController.submitRating);

// GET /user-ratings/:userId – public
router.get('/user-ratings/:userId', ratingController.getUserRatings);

module.exports = router;
