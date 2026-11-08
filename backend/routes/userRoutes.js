'use strict';

const router = require('express').Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/verifyToken');
const { optionalToken } = require('../middlewares/verifyToken');
const validate = require('../middlewares/validate');
const { updateProfileSchema } = require('../validators/userSchemas');

// Account creation lives in authRoutes (POST /auth/register).

// GET /user/:uid – public profile; the owner (valid token) gets the full profile
router.get('/user/:uid', optionalToken, userController.getUser);

// PATCH /user/:uid – protected (must be your own profile)
router.patch('/user/:uid', verifyToken, validate(updateProfileSchema), userController.updateUser);

module.exports = router;
