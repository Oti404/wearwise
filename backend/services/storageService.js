'use strict';

const { supabase } = require('../config/supabase');
const AppError = require('../middlewares/AppError');

/**
 * Upload a base64 image to Supabase Storage.
 * @param {string} base64Data 
 * @param {string} mimeType 
 * @param {string} fileName 
 * @returns {Promise<string>} Public URL of the uploaded image
 */
async function uploadImage(base64Data, mimeType, fileName) {
    if (!base64Data) return null;

    try {
        const buffer = Buffer.from(base64Data, 'base64');
        const bucketName = 'clothes';
        const filePath = `${Date.now()}_${fileName}`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
                contentType: mimeType,
                upsert: true
            });

        if (error) {
            console.error('[Supabase Storage] ❌ Upload error:', error.message);
            throw new AppError(`Eroare la încărcarea imaginii: ${error.message}`, 500);
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError('Eroare internă la procesarea imaginii.', 500);
    }
}

/**
 * Delete an image from Supabase Storage.
 * @param {string} url 
 */
async function deleteImage(url) {
    try {
        const bucketName = 'clothes';
        // Extract filename from public URL
        const fileName = url.split('/').pop();
        
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([fileName]);

        if (error) {
            console.error('[Supabase Storage] ❌ Delete error:', error.message);
        }
    } catch (err) {
        console.error('[Supabase Storage] ❌ Delete catch error:', err.message);
    }
}

module.exports = { uploadImage, deleteImage };
