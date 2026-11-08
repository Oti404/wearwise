'use strict';

const axios = require('axios');
const FormData = require('form-data');
const AppError = require('../middlewares/AppError');

/**
 * Proxy an image buffer to the Python AI engine.
 *
 * @param {Buffer} buffer   - File buffer from multer
 * @param {string} filename - Original filename
 * @param {string} mimetype - MIME type
 * @returns {object} AI engine response JSON
 */
async function analyzeImage(buffer, filename, mimetype) {
  const AI_ENGINE_URL = process.env.AI_ENGINE_URL;
  if (!AI_ENGINE_URL) {
    console.error('[aiService] AI_ENGINE_URL is not set.');
    throw new AppError('AI service is not configured.', 500);
  }

  const form = new FormData();
  form.append('file', buffer, { filename: filename || 'upload.jpg', contentType: mimetype });
  // The engine only listens on the internal Docker network, so no auth header is needed.
  const headers = form.getHeaders();

  try {
    console.log(`[aiService] Forwarding to ${AI_ENGINE_URL}/classify/file`);
    const response = await axios.post(`${AI_ENGINE_URL}/classify/file`, form, {
      headers,
      timeout: 30000,
    });
    return response.data;
  } catch (err) {
    console.error('[aiService] AI Engine error:', err.message);
    // Pass client errors (bad or oversized image) through instead of masking them as an outage.
    const status = err.response?.status;
    if (status === 400 || status === 413) {
      throw new AppError(err.response.data?.detail || 'Invalid image.', status);
    }
    throw new AppError('The AI service is unavailable right now.', 503);
  }
}

module.exports = { analyzeImage };
