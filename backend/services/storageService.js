'use strict';

/**
 * STORAGE SERVICE — images saved to the local uploads directory (a Docker volume in production)
 * and served by the backend under /uploads.
 */

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const AppError = require('../middlewares/AppError');
const { uploadDir, publicApiUrl } = require('../config/storage');

// The client-supplied MIME type can't be trusted, so the type is detected from the file's magic bytes.
const SIGNATURES = [
  { ext: 'jpg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', matches: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
];

function detectImageExtension(buffer) {
  if (!buffer || buffer.length < 12) return null;
  return SIGNATURES.find((sig) => sig.matches(buffer))?.ext ?? null;
}

/**
 * @param {Buffer} buffer Raw file bytes
 * @returns {Promise<string>} Absolute public URL of the stored image
 */
async function saveImage(buffer) {
  const ext = detectImageExtension(buffer);
  if (!ext) throw new AppError('Only JPEG, PNG and WebP images are allowed.', 400);

  // Random names: unguessable and never derived from user input (no path traversal).
  const fileName = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(uploadDir, fileName), buffer, { flag: 'wx' });

  return `${publicApiUrl}/uploads/${fileName}`;
}

module.exports = { saveImage, detectImageExtension };
