/**
 * SQL SEED SCRIPT — Supabase Direct
 * Fix: Using DIRECT_URL (port 5432) to bypass PGBouncer Transaction Mode,
 * which caused FATAL XX000 errors due to prepared statement incompatibility.
 */
const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
require('dotenv').config();
const { admin } = require('./config/firebase');

// ==========================================
// CONEXIUNEA — FIX PENTRU XX000
// ==========================================
// Folosim DIRECT_URL (port 5432) care ocoleste PGBouncer-ul.
// Daca nu ai DIRECT_URL setat in .env, folosim DATABASE_URL cu prepare:false.
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
    console.error('❌ EROARE: Parola bazei de date nu este setata in .env!');
    console.error('   Deschide fisierul .env si inlocuieste [YOUR-PASSWORD] cu parola reala din Supabase Dashboard.');
    console.error('   Supabase → Settings → Database → Database password');
    process.exit(1);
}

const sql = postgres(connectionString, {
    ssl: 'require',
    prepare: false, // Critica pentru compatibilitate cu PGBouncer Transaction Mode
});

const bucket = admin.storage().bucket();
const dataPath = path.resolve(__dirname, '../frontend/assets/wardrobe/all');
const assetsRoot = path.resolve(__dirname, '../frontend/assets');

const CATEGORY_MAP = {
    'TRICOURI_DATA': 'T-shirts',
    'PANTALONI_DATA': 'Pants',
    'ROCHII_DATA': 'Dresses',
    'TOPURI_DATA': 'T-shirts',
    'SACOURI_DATA': 'Outerwear',
    'PANTOFI_DATA': 'Footwear'
};

async function uploadImage(localRelativePath) {
    const fullPath = path.join(assetsRoot, localRelativePath);
    if (!fs.existsSync(fullPath)) return null;
    const fileName = path.basename(localRelativePath);
    const destination = `clothes_seed/${Date.now()}_${fileName}`;
    try {
        await bucket.upload(fullPath, {
            destination: destination,
            metadata: { cacheControl: 'public, max-age=31536000' }
        });
        return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;
    } catch (err) {
        console.error(`  [Storage] ❌ Upload failed for ${fileName}:`, err.message);
        return null;
    }
}

function parseDataFile(content) {
    const allItems = [];
    for (const [exportName, category] of Object.entries(CATEGORY_MAP)) {
        const arrayRegex = new RegExp(`export const ${exportName}:[^=]*= \\[([\\s\\S]*?)\\];`, 'g');
        const arrayMatch = arrayRegex.exec(content);
        if (arrayMatch) {
            const arrayBody = arrayMatch[1];
            const objectRegex = /\{([\s\S]*?)\}/g;
            let objMatch;
            let count = 0;
            while ((objMatch = objectRegex.exec(arrayBody)) !== null && count < 3) {
                const body = objMatch[1];
                const model = body.match(/model:\s*"([^"]*)"/)?.[1];
                const img = body.match(/img_url:\s*"([^"]*)"/)?.[1];
                const priceValue = body.match(/pret_ron:\s*([\d.]+)/)?.[1];
                const price = priceValue ? parseFloat(priceValue) : 99.0;
                if (model && img) {
                    allItems.push({ name: model, imgPath: img, price, category });
                    count++;
                }
            }
        }
    }
    return allItems;
}

async function run() {
    console.log('🚀 Starting SQL Seed (Supabase Direct)...\n');

    // Validare conexiune
    const [testResult] = await sql`SELECT 1 as ok`;
    console.log('✅ Conexiune Supabase OK!\n');

    // Creare/regasire utilizator de seed
    const [user] = await sql`
        INSERT INTO users (auth_uid, email, first_name, last_name)
        VALUES ('system_seed_user', 'seed@wearwise.app', 'System', 'Seed')
        ON CONFLICT (auth_uid) DO UPDATE SET email = EXCLUDED.email
        RETURNING id
    `;
    const userId = user.id;
    console.log(`👤 Seed user ID: ${userId}\n`);

    // Citire fisier cu date
    if (!fs.existsSync(dataPath)) {
        console.error(`❌ Fisierul cu date nu exista: ${dataPath}`);
        process.exit(1);
    }
    const content = fs.readFileSync(dataPath, 'utf8');
    const items = parseDataFile(content);
    console.log(`🧪 ${items.length} articole gasite. Se uploadeaza imaginile si se insereaza in Supabase...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
        process.stdout.write(`📦 ${item.name}... `);

        const url = await uploadImage(item.imgPath);
        if (!url) {
            console.log('⏭️  Imagine lipsa, skip.');
            continue;
        }

        try {
            const [cloth] = await sql`
                INSERT INTO clothes (user_id, name, description, price, category, size, condition, mode, status, latitude, longitude)
                VALUES (
                    ${userId},
                    ${item.name},
                    ${'SEED: ' + item.category},
                    ${item.price},
                    ${item.category},
                    'M',
                    'new',
                    'sell',
                    'active',
                    44.43,
                    26.09
                )
                RETURNING id
            `;

            await sql`
                INSERT INTO clothing_images (clothing_id, url, is_primary)
                VALUES (${cloth.id}, ${url}, true)
            `;

            successCount++;
            console.log('✅');
        } catch (err) {
            errorCount++;
            console.log(`❌ ${err.message}`);
        }
    }

    console.log(`\n✨ DONE! ✅ ${successCount} articole adaugate in Supabase. ❌ ${errorCount} erori.`);
    await sql.end();
    process.exit(0);
}

run().catch(err => {
    console.error('🔥 FATAL:', err.message);
    process.exit(1);
});
