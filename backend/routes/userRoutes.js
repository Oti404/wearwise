'use strict';

const router = require('express').Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/verifyToken');
const validate = require('../middlewares/validate');
const { updateProfileSchema } = require('../validators/userSchemas');

// Account creation lives in authRoutes (POST /auth/register).

// GET /user/:identifier – public
router.get('/user/:identifier', userController.getUser);

// PATCH /user/:uid – protected (must be your own profile)
router.patch('/user/:uid', verifyToken, validate(updateProfileSchema), userController.updateUser);

module.exports = router;
