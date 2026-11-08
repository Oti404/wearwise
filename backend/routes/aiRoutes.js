'use strict';

const router = require('express').Router();
const multer = require('multer');
const aiController = require('../controllers/aiController');
const verifyToken = require('../middlewares/verifyToken');
const AppError = require('../middlewares/AppError');
const { uploadLimiter } = require('../config/rateLimit');
const { maxUploadBytes } = require('../config/storage');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes, files: 1 },
});

// Translate multer's limit errors into client errors instead of generic 500s.
const singleImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return next(err.code === 'LIMIT_FILE_SIZE'
        ? new AppError(`Image must be at most ${maxUploadBytes / (1024 * 1024)} MB.`, 413)
        : new AppError('Send exactly one file in the "image" field.', 400));
    }
    return next(err);
  });
};

// POST /ai/analyze – protected: inference is CPU-heavy, so only signed-in users may trigger it.
router.post('/ai/analyze', verifyToken, uploadLimiter, singleImage, aiController.analyzeImage);

module.exports = router;
