'use strict';

const userService = require('../services/userService');

const register = async (req, res) => {
  const { uid, ...data } = req.body;
  const userData = await userService.registerUser(uid, data);
  res.status(201).json({ 
    message: 'User înregistrat cu succes.', 
    userData: { ...userData, uid: userData.authUid } 
  });
};

const getUser = async (req, res) => {
  const userData = await userService.getUserByIdentifier(req.params.identifier);
  res.json({ ...userData, uid: userData.authUid });
};

const updateUser = async (req, res) => {
  // For the PATCH route, uid comes from the URL param.
  // verifyToken ensures req.user.uid === req.params.uid on the route level.
  const updated = await userService.updateUser(req.params.uid, req.body);
  res.json({ ...updated, uid: updated.authUid });
};

module.exports = { register, getUser, updateUser };
