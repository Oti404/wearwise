'use strict';

const { db } = require('./drizzle/db');
require('dotenv').config();

async function run() {
    try {
        console.log('📜 Attempting to create public storage policy for "clothes" bucket...');
        
        // Use raw SQL to enable public access for SELECT on the bucket
        // Note: We use the direct connection if possible, but db.execute should work.
        await db.execute(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access'
                ) THEN
                    CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'clothes');
                END IF;
            END
            $$;
        `);
        
        console.log('✅ Storage policy "Public Access" is active.');
    } catch (e) {
        console.error('❌ Error setting storage policy:', e.message);
        console.log('💡 TIP: You might need to manually enable "Public" access and add a "SELECT" policy for the "clothes" bucket in the Supabase Dashboard -> Storage -> Policies.');
    }
    process.exit(0);
}

run();
