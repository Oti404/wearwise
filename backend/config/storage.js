'use strict';

const fs = require('fs');
const path = require('path');

const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'));

// Created at startup so the first upload never fails on a fresh volume.
fs.mkdirSync(uploadDir, { recursive: true });

module.exports = {
  uploadDir,
  // Public base URL of this API; stored image URLs are absolute because the frontend runs on another origin.
  publicApiUrl: (process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, ''),
  maxUploadBytes: 5 * 1024 * 1024,
};
