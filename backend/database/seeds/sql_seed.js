/**
 * SQL SEED SCRIPT (WearWise 2.0)
 * Simulates adding clothing items by parsing existing assets, 
 * uploading images to Firebase Storage, and inserting into SQL via Drizzle.
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { admin } = require('./config/firebase');
const { db } = require('./drizzle/db');
const schema = require('./drizzle/schema');
const { clothes, clothingImages, users } = schema;

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
  if (!fs.existsSync(fullPath)) {
    console.warn(`  [Storage] ⚠️ File not found: ${fullPath}`);
    return null;
  }

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
      while ((objMatch = objectRegex.exec(arrayBody)) !== null && count < 3) { // 3 items per category for simulation
        const body = objMatch[1];
        const model = body.match(/model:\s*"([^"]*)"/)?.[1];
        const img = body.match(/img_url:\s*"([^"]*)"/)?.[1];
        const priceValue = body.match(/pret_ron:\s*([\d.]+)/)?.[1];
        const price = priceValue ? parseFloat(priceValue) : 0;
        if (model && img) {
          allItems.push({ name: model, imgPath: img, price, category });
          count++;
        }
      }
    }
  }
  return allItems;
}

async function runSeed() {
  console.log('🚀 Starting SQL Simulation Seed...');
  
  // 1. Ensure seed user exists in SQL
  const [seedUser] = await db.insert(users).values({
    authUid: 'system_seed_user',
    email: 'seed@wearwise.app',
    firstName: 'System',
    lastName: 'Seed',
  }).onConflictDoUpdate({
    target: [users.authUid],
    set: { email: 'seed@wearwise.app' }
  }).returning();

  const userId = seedUser.id;

  if (!fs.existsSync(dataPath)) {
    console.error(`❌ Data file missing at: ${dataPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(dataPath, 'utf8');
  const itemsToSeed = parseDataFile(content);
  
  console.log(`🧪 Preparing to seed ${itemsToSeed.length} items to SQL...`);

  let successCount = 0;

  for (const itemData of itemsToSeed) {
    console.log(`📦 Processing: ${itemData.name}...`);
    
    const publicUrl = await uploadImage(itemData.imgPath);
    if (!publicUrl) continue;

    try {
      await db.transaction(async (tx) => {
        const [newCloth] = await tx.insert(clothes).values({
          userId: userId,
          name: itemData.name,
          description: `SIMULATION: Premium ${itemData.category} from local assets.`,
          price: itemData.price,
          category: itemData.category,
          size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
          condition: ['new', 'good', 'fair'][Math.floor(Math.random() * 3)],
          mode: 'sell',
          status: 'active',
          latitude: 44.4396 + (Math.random() * 0.05 - 0.025),
          longitude: 26.0963 + (Math.random() * 0.05 - 0.025),
        }).returning();

        await tx.insert(clothingImages).values({
          clothingId: newCloth.id,
          url: publicUrl,
          isPrimary: true
        });
      });
      successCount++;
      console.log(`   ✅ Inserted: ${itemData.name}`);
    } catch (err) {
      console.error(`   ❌ Failed to insert ${itemData.name}:`, err.message);
    }
  }

  console.log(`\n✨ SIMULATION COMPLETE!`);
  console.log(`✅ ${successCount} items added to SQL.`);
  process.exit(0);
}

runSeed().catch(err => {
  console.error('\n🔥 FATAL ERROR:', err);
  process.exit(1);
});
