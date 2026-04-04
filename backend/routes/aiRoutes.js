'use strict';

const router = require('express').Router();
const multer = require('multer');
const aiController = require('../controllers/aiController');

const upload = multer({ storage: multer.memoryStorage() });

// POST /ai/analyze – multipart file upload
router.post('/ai/analyze', upload.single('image'), aiController.analyzeImage);

module.exports = router;
