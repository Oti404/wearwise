'use strict';

const notificationService = require('../services/notificationSqlService');
const AppError = require('../middlewares/AppError');

const getNotifications = async (req, res) => {
  // The :userId segment is kept for URL compatibility, but it must match the token.
  if (req.params.userId !== req.user.uid) {
    throw new AppError('You can only view your own notifications.', 403);
  }
  const { cursor, limit } = req.query;
  const result = await notificationService.getNotificationsPage(req.user.uid, { cursor, limit });
  // Return only the items array for backward compatibility
  res.json(result.items);
};

module.exports = { getNotifications };
