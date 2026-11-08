'use strict';

const userService = require('../services/userService');
const AppError = require('../middlewares/AppError');

const getUser = async (req, res) => {
  const userData = await userService.getUserByIdentifier(req.params.identifier);
  res.json({ ...userData, uid: userData.authUid });
};

const updateUser = async (req, res) => {
  if (req.user.uid !== req.params.uid) {
    throw new AppError('You can only edit your own profile.', 403);
  }
  const updated = await userService.updateUser(req.params.uid, req.body);
  res.json({ ...updated, uid: updated.authUid });
};

module.exports = { getUser, updateUser };
