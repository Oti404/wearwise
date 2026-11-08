'use strict';

const router = require('express').Router();
const multer = require('multer');

const verifyToken = require('../middlewares/verifyToken');
const AppError = require('../middlewares/AppError');
const { uploadLimiter } = require('../config/rateLimit');
const { maxUploadBytes } = require('../config/storage');
const uploadController = require('../controllers/uploadController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes, files: 1 },
});

// Translate multer's limit errors into client errors instead of generic 500s.
const singleImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? `Image must be at most ${maxUploadBytes / (1024 * 1024)} MB.`
        : 'Send exactly one file in the "image" field.';
      return next(new AppError(message, status));
    }
    return next(err);
  });
};

// POST /uploads – protected, multipart field "image"
router.post('/', verifyToken, uploadLimiter, singleImage, uploadController.uploadImage);

module.exports = router;
