'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/followController');
const verifyToken = require('../middlewares/verifyToken');

// Protected routes (require auth)
router.post('/follow', verifyToken, ctrl.follow);
router.delete('/follow', verifyToken, ctrl.unfollow);
router.get('/follow-status/:targetUserId', verifyToken, ctrl.followStatus);
router.get('/following-feed', verifyToken, ctrl.getFollowingFeed);

// Semi-public (auth optional for suggested users)
router.get('/community/suggested', verifyToken, ctrl.getSuggestedUsers);

// Public routes
router.get('/followers/:userId', ctrl.getFollowers);
router.get('/following/:userId', ctrl.getFollowing);
router.get('/public-profile/:userId', ctrl.getPublicProfile);
router.get('/community/search', ctrl.searchUsers);

module.exports = router;
