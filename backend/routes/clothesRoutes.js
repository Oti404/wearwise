'use strict';

const router = require('express').Router();
const clothesController = require('../controllers/clothesController');
const verifyToken = require('../middlewares/verifyToken');
const validate = require('../middlewares/validate');
const { createClothesSchema } = require('../validators/clothesSchemas');

// GET /clothes?cursor=&limit=10&excludeUser= – public, paginated
router.get('/clothes', clothesController.getClothes);

// GET /clothes/:id – public
router.get('/clothes/:id', clothesController.getClothesById);

// POST /clothes – protected
router.post('/clothes', verifyToken, validate(createClothesSchema), clothesController.createItem);

// PATCH /clothes/:id/sold – protected, mark item as sold
router.patch('/clothes/:id/sold', verifyToken, clothesController.markAsSold);

// GET /user-closet/:userId – public
router.get('/user-closet/:userId', clothesController.getUserCloset);

module.exports = router;
