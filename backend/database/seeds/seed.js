'use strict';

/**
 * Demo seed — creates a demo account and listings from the local wardrobe catalog.
 * Images are copied into UPLOAD_DIR through storageService, exactly like real uploads.
 *
 * Usage: SEED_PASSWORD=... npm run seed
 * Idempotent: does nothing when the demo account already exists.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { eq } = require('drizzle-orm');

const { db, client } = require('../../drizzle/db');
const { users, clothes, clothingImages } = require('../../drizzle/schema');
const authService = require('../../services/authService');
const storageService = require('../../services/storageService');

const DEMO_EMAIL = 'demo@wearwise.app';
const ITEMS_PER_CATEGORY = 3;
const WARDROBE_DIR = path.join(__dirname, 'wardrobe');

// Catalog export name → app category.
const CATEGORY_MAP = {
  TRICOURI_DATA: 'T-shirts',
  TOPURI_DATA: 'T-shirts',
  BLUZE_DATA: 'T-shirts',
  PANTALONI_DATA: 'Pants',
  ROCHII_DATA: 'Dresses',
  SACOURI_DATA: 'Outerwear',
  PANTOFI_DATA: 'Footwear',
};

// Demo listings are scattered around Bucharest so the radius filter has something to show.
const CENTER = { lat: 44.4396, lon: 26.0963 };

const pick = (values) => values[Math.floor(Math.random() * values.length)];

/**
 * The catalog is a TypeScript module, so it is read as text rather than imported.
 * @returns {{ name: string, imgPath: string, price: number, category: string }[]}
 */
function parseCatalog(content) {
  const items = [];
  for (const [exportName, category] of Object.entries(CATEGORY_MAP)) {
    const arrayMatch = content.match(new RegExp(`${exportName}[^=]*=\\s*\\[([\\s\\S]*?)\\n\\];`));
    if (!arrayMatch) continue;

    // Sections use different indentation; an object ends at the first line that starts with "}".
    const objectRegex = /\{([\s\S]*?)\n[ \t]*\}/g;
    let match;
    let count = 0;
    while ((match = objectRegex.exec(arrayMatch[1])) !== null && count < ITEMS_PER_CATEGORY) {
      const body = match[1];
      const name = body.match(/model:\s*"([^"]*)"/)?.[1];
      const imgPath = body.match(/img_url:\s*"wardrobe\/([^"]*)"/)?.[1];
      const price = parseFloat(body.match(/pret_ron:\s*([\d.]+)/)?.[1] ?? '0');
      if (name && imgPath) {
        items.push({ name, imgPath, price, category });
        count++;
      }
    }
  }
  return items;
}

async function run() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('SEED_PASSWORD must be set (at least 8 characters).');
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, DEMO_EMAIL) });
  if (existing) {
    console.log(`[seed] ${DEMO_EMAIL} already exists — skipping.`);
    return;
  }

  const { user } = await authService.register({
    email: DEMO_EMAIL,
    password,
    firstName: 'Demo',
    lastName: 'Seller',
    phone: '0700000000',
    city: 'Bucharest',
  });

  const items = parseCatalog(fs.readFileSync(path.join(WARDROBE_DIR, 'all'), 'utf8'));
  let inserted = 0;

  for (const item of items) {
    const imageFile = path.join(WARDROBE_DIR, item.imgPath);
    if (!fs.existsSync(imageFile)) {
      console.warn(`[seed] Image missing, skipped: ${item.imgPath}`);
      continue;
    }

    const url = await storageService.saveImage(fs.readFileSync(imageFile));

    await db.transaction(async (tx) => {
      const [cloth] = await tx.insert(clothes).values({
        userId: user.id,
        name: item.name,
        description: `Demo listing: ${item.category.toLowerCase()} in great shape.`,
        price: item.price,
        category: item.category,
        size: pick(['S', 'M', 'L', 'XL']),
        condition: pick(['new', 'good', 'fair']),
        mode: 'sell',
        status: 'active',
        latitude: CENTER.lat + (Math.random() * 0.05 - 0.025),
        longitude: CENTER.lon + (Math.random() * 0.05 - 0.025),
      }).returning();

      await tx.insert(clothingImages).values({ clothingId: cloth.id, url, isPrimary: true });
    });
    inserted++;
  }

  console.log(`[seed] Created ${DEMO_EMAIL} with ${inserted} listings.`);
}

run()
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
