'use strict';

const notificationService = require('../services/notificationSqlService');

const getNotifications = async (req, res) => {
  const { cursor, limit } = req.query;
  const result = await notificationService.getNotificationsPage(req.params.userId, { cursor, limit });
  // Return only the items array for backward compatibility
  res.json(result.items);
};

module.exports = { getNotifications };
