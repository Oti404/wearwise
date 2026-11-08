'use strict';

const authService = require('../services/authService');

// `uid` is kept in responses because the frontend already keys users by it.
const toPublicUser = (user) => ({ ...user, uid: user.authUid });

const register = async (req, res) => {
  const { user, token } = await authService.register(req.body);
  res.status(201).json({ token, user: toPublicUser(user) });
};

const login = async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.json({ token, user: toPublicUser(user) });
};

const me = async (req, res) => {
  const user = await authService.getCurrentUser(req.user.uid);
  res.json({ user: toPublicUser(user) });
};

module.exports = { register, login, me };
