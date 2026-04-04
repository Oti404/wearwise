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
    console.error('[aiService] EROARE: AI_ENGINE_URL nu este definit în .env');
    throw new AppError('Configurația serverului AI lipsește.', 500);
  }

  const form = new FormData();
  form.append('file', buffer, { filename: filename || 'upload.jpg', contentType: mimetype });

  const headers = { ...form.getHeaders() };
  if (process.env.HF_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`;
  }

  try {
    console.log(`[aiService] Forwarding to ${AI_ENGINE_URL}/classify/file`);
    const response = await axios.post(`${AI_ENGINE_URL}/classify/file`, form, {
      headers,
      timeout: 30000,
    });
    console.log('[aiService] AI Engine responded:', JSON.stringify(response.data));
    return response.data;
  } catch (err) {
    console.error('[aiService] AI Engine error:', err.message);
    if (err.response) console.error('[aiService] Detail:', err.response.data);
    throw new AppError('Serviciul AI nu este disponibil momentan.', 503);
  }
}

module.exports = { analyzeImage };
