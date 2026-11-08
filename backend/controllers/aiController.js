'use strict';

const aiService = require('../services/aiService');
const { detectImageExtension } = require('../services/storageService');
const AppError = require('../middlewares/AppError');

const MIME_BY_EXT = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

const analyzeImage = async (req, res) => {
  if (!req.file) throw new AppError('No image provided in the "image" field.', 400);

  // Trust the file's bytes, not the client's Content-Type: reject non-images before they reach the AI engine.
  const ext = detectImageExtension(req.file.buffer);
  if (!ext) throw new AppError('Only JPEG, PNG and WebP images are allowed.', 400);

  const result = await aiService.analyzeImage(req.file.buffer, `image.${ext}`, MIME_BY_EXT[ext]);
  res.json(result);
};

module.exports = { analyzeImage };
