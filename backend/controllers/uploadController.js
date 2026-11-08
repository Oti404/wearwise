'use strict';

const storageService = require('../services/storageService');
const AppError = require('../middlewares/AppError');

const uploadImage = async (req, res) => {
  if (!req.file) throw new AppError('No image provided in the "image" field.', 400);
  const url = await storageService.saveImage(req.file.buffer);
  res.status(201).json({ url });
};

module.exports = { uploadImage };
