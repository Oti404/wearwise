'use strict';

const userService = require('../services/userService');
const AppError = require('../middlewares/AppError');

const getUser = async (req, res) => {
  const user = await userService.getUserByUid(req.params.uid);
  // Owners see their full profile (email, phone); everyone else gets the public subset.
  if (req.user?.uid === user.authUid) {
    return res.json({ ...user, uid: user.authUid });
  }
  return res.json(userService.toPublicProfile(user));
};

const updateUser = async (req, res) => {
  if (req.user.uid !== req.params.uid) {
    throw new AppError('You can only edit your own profile.', 403);
  }
  const updated = await userService.updateUser(req.params.uid, req.body);
  res.json({ ...updated, uid: updated.authUid });
};

module.exports = { getUser, updateUser };
