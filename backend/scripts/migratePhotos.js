'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { admin } = require('../config/firebase');
const { supabase } = require('../config/supabase');
const { db } = require('../drizzle/db');
const { clothingImages } = require('../drizzle/schema');
const { eq, like } = require('drizzle-orm');

async function migrate() {
    console.log('🚀 Starting Photos Migration: Firebase -> Supabase...\n');

    // 1. Get all images that are stored in Firebase (contain 'firebasestorage')
    const imagesToMigrate = await db.query.clothingImages.findMany({
        where: like(clothingImages.url, '%firebasestorage.googleapis.com%')
    });

    console.log(`📸 Found ${imagesToMigrate.length} images to migrate.`);

    let successCount = 0;
    let errorCount = 0;

    for (const img of imagesToMigrate) {
        process.stdout.write(`🔄 Migrating image ${img.id}... `);

        try {
            // 2. Download from Firebase
            const response = await axios.get(img.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || 'image/jpeg';
            
            // 3. Upload to Supabase
            const fileName = `migrated_${img.id}_${Date.now()}.jpg`;
            const { data, error } = await supabase.storage
                .from('clothes')
                .upload(fileName, buffer, {
                    contentType,
                    upsert: true
                });

            if (error) throw new Error(`Supabase upload error: ${error.message}`);

            // 4. Get public URL
            const { data: publicUrlData } = supabase.storage
                .from('clothes')
                .getPublicUrl(fileName);
            
            const newUrl = publicUrlData.publicUrl;

            // 5. Update DB
            await db.update(clothingImages)
                .set({ url: newUrl })
                .where(eq(clothingImages.id, img.id));

            successCount++;
            console.log('✅ Success');
        } catch (err) {
            errorCount++;
            console.log(`❌ Error: ${err.message}`);
        }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`✅ ${successCount} successfully migrated.`);
    console.log(`❌ ${errorCount} errors.`);
    
    process.exit(0);
}

migrate().catch(err => {
    console.error('🔥 Fatal migration error:', err);
    process.exit(1);
});
