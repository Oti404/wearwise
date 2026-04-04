'use strict';

const router = require('express').Router();
const notificationController = require('../controllers/notificationController');

// GET /notifications/:userId?cursor=&limit=10 – public (auth optional, based on product needs)
router.get('/notifications/:userId', notificationController.getNotifications);

module.exports = router;
