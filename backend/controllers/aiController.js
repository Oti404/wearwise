'use strict';

const aiService = require('../services/aiService');
const AppError = require('../middlewares/AppError');

const analyzeImage = async (req, res) => {
  if (!req.file) throw new AppError('Fișierul imagine este obligatoriu.', 400);

  console.log(`[aiController] Received: ${req.file.originalname} (${req.file.size} bytes)`);
  const result = await aiService.analyzeImage(req.file.buffer, req.file.originalname, req.file.mimetype);
  res.json(result);
};

module.exports = { analyzeImage };
