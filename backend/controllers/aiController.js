'use strict';

const aiService = require('../services/aiService');
const AppError = require('../middlewares/AppError');

const analyzeImage = async (req, res) => {
  if (!req.file) throw new AppError('No image provided in the "image" field.', 400);

  const result = await aiService.analyzeImage(req.file.buffer, req.file.originalname, req.file.mimetype);
  res.json(result);
};

module.exports = { analyzeImage };
