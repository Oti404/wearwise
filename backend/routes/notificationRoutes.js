'use strict';

const router = require('express').Router();
const verifyToken = require('../middlewares/verifyToken');
const notificationController = require('../controllers/notificationController');

// GET /notifications/:userId?cursor=&limit=10 – protected: users can only read their own notifications.
router.get('/notifications/:userId', verifyToken, notificationController.getNotifications);

module.exports = router;
