'use strict';

const router = require('express').Router();
const ratingController = require('../controllers/ratingController');
const validate = require('../middlewares/validate');
const { submitRatingSchema } = require('../validators/ratingSchemas');

// POST /ratings – validated
router.post('/ratings', validate(submitRatingSchema), ratingController.submitRating);

// GET /user-ratings/:userId – public
router.get('/user-ratings/:userId', ratingController.getUserRatings);

module.exports = router;
