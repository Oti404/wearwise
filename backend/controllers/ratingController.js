'use strict';

const ratingService = require('../services/ratingSqlService');

const submitRating = async (req, res) => {
  await ratingService.submitRating(req.user.uid, req.body);
  res.json({ success: true, message: 'Rating submitted.' });
};

const getUserRatings = async (req, res) => {
  const ratings = await ratingService.getUserRatings(req.params.userId);
  res.json(ratings);
};

module.exports = { submitRating, getUserRatings };
