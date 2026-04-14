'use strict';

const fs = require('fs');
const path = require('path');
const { db, admin } = require('./config/firebase');

const bucket = admin.storage().bucket();
const dataPath = path.resolve(__dirname, '../frontend/assets/wardrobe/all');
const assetsRoot = path.resolve(__dirname, '../frontend/assets');

/**
 * Maps the internal data object names to backend categories
 */
const CATEGORY_MAP = {
  'TRICOURI_DATA': 'T-shirts',
  'PANTALONI_DATA': 'Pants',
  'ROCHII_DATA': 'Dresses',
  'TOPURI_DATA': 'T-shirts',
  'SACOURI_DATA': 'Outerwear',
  'PANTOFI_DATA': 'Footwear'
};

/**
 * Uploads a local image to Firebase Storage and returns the public URL
 */
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
    // Universal Firebase Storage URL format
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;
  } catch (err) {
    console.error(`  [Storage] ❌ Upload failed for ${fileName}:`, err.message);
    return null;
  }
}

/**
 * Simple parser for the TypeScript data file using regex
 */
function parseDataFile(content) {
  const allItems = [];
  
  for (const [exportName, category] of Object.entries(CATEGORY_MAP)) {
    console.log(`[Parser] Looking for ${exportName}...`);
    
    // Find the array block for this export
    const arrayRegex = new RegExp(`export const ${exportName}:[^=]*= \\[([\\s\\S]*?)\\];`, 'g');
    const arrayMatch = arrayRegex.exec(content);
    
    if (arrayMatch) {
      const arrayBody = arrayMatch[1];
      // Match individual objects { ... }
      const objectRegex = /\{([\s\S]*?)\}/g;
      let objMatch;
      let count = 0;
      
      while ((objMatch = objectRegex.exec(arrayBody)) !== null && count < 8) { // 8 items per category
        const body = objMatch[1];
        const model = body.match(/model:\s*"([^"]*)"/)?.[1];
        const img = body.match(/img_url:\s*"([^"]*)"/)?.[1];
        const price = parseFloat(body.match(/pret_ron:\s*([\d.]+)/)?.[1] || "0");
        
        if (model && img) {
          allItems.push({ name: model, imgPath: img, price, category });
          count++;
        }
      }
      console.log(`[Parser]   Found ${count} items for ${category}`);
    }
  }
  return allItems;
}

async function seed() {
  console.log('🚀 Starting Seed Process...');
  
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ Data file missing at: ${dataPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(dataPath, 'utf8');
  const itemsToSeed = parseDataFile(content);
  
  if (itemsToSeed.length === 0) {
    console.error('❌ No items found to seed. Check the regex parser or file content.');
    process.exit(1);
  }

  console.log(`🧪 Preparing to seed ${itemsToSeed.length} items to Firestore...`);

  const batch = db.batch();
  let successCount = 0;

  for (const itemData of itemsToSeed) {
    console.log(`📦 Processing: ${itemData.name}...`);
    
    const publicUrl = await uploadImage(itemData.imgPath);
    if (!publicUrl) {
      console.log(`   ⏭️ Skipping due to missing image.`);
      continue;
    }

    const sizes = ['S', 'M', 'L', 'XL'];
    const conditions = ['new', 'good', 'fair'];
    const modes = ['sell', 'sell', 'trade', 'both', 'donate'];
    const mode = modes[Math.floor(Math.random() * modes.length)];

    const firestoreData = {
      userId: 'system_seed_user',
      name: itemData.name,
      description: `Premium ${itemData.category} from the WearWise official seed collection.`,
      images: [publicUrl],
      category: itemData.category,
      size: sizes[Math.floor(Math.random() * sizes.length)],
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      mode: mode,
      price: (mode === 'trade' || mode === 'donate') ? null : itemData.price,
      latitude: 44.4396 + (Math.random() * 0.05 - 0.025), // Precise Bucharest area
      longitude: 26.0963 + (Math.random() * 0.05 - 0.025),
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = db.collection('clothes').doc();
    batch.set(docRef, firestoreData);
    successCount++;
  }

  if (successCount > 0) {
    await batch.commit();
    console.log(`\n✨ SEED COMPLETE!`);
    console.log(`✅ ${successCount} items added to Firestore.`);
    console.log(`☁️  Images uploaded to Firebase Storage.`);
  } else {
    console.log('\n⚠️ No items were seeded. Please check the logs above.');
  }

  process.exit(0);
}

seed().catch(err => {
  console.error('\n🔥 FATAL ERROR during seed:', err);
  process.exit(1);
});
