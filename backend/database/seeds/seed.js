'use strict';

/**
 * Demo seed — creates a demo account with generic listings.
 * Each listing gets a generated placeholder image (a coloured PNG per category), stored through
 * storageService exactly like a real upload. No third-party product photos are shipped in the repo.
 *
 * Usage: SEED_PASSWORD=... npm run seed
 * Idempotent: does nothing when the demo account already exists.
 */

require('dotenv').config();
const zlib = require('zlib');
const { eq } = require('drizzle-orm');

const { db, client } = require('../../drizzle/db');
const { users, clothes, clothingImages } = require('../../drizzle/schema');
const authService = require('../../services/authService');
const storageService = require('../../services/storageService');

const DEMO_EMAIL = 'demo@wearwise.app';

// Listings are scattered around Bucharest so the radius filter has something to show.
const CENTER = { lat: 44.4396, lon: 26.0963 };

// Muted colour per category: [background, accent stripe] as RGB.
const PALETTE = {
  'T-shirts': [[226, 232, 240], [148, 163, 184]],
  Pants: [[199, 210, 254], [99, 102, 241]],
  Dresses: [[251, 207, 232], [219, 39, 119]],
  Outerwear: [[214, 211, 209], [120, 113, 108]],
  Footwear: [[254, 215, 170], [234, 88, 12]],
};

const DEMO_ITEMS = [
  { name: 'Basic Cotton Tee', category: 'T-shirts', price: 35 },
  { name: 'Striped Long Sleeve Top', category: 'T-shirts', price: 55 },
  { name: 'Oversized Graphic Tee', category: 'T-shirts', price: 45 },
  { name: 'Linen Button-Up Shirt', category: 'T-shirts', price: 80 },
  { name: 'Straight Leg Jeans', category: 'Pants', price: 120 },
  { name: 'Wide Leg Trousers', category: 'Pants', price: 110 },
  { name: 'Cargo Pants', category: 'Pants', price: 95 },
  { name: 'Floral Midi Dress', category: 'Dresses', price: 150 },
  { name: 'Black Slip Dress', category: 'Dresses', price: 130 },
  { name: 'Wool Blend Coat', category: 'Outerwear', price: 260 },
  { name: 'Denim Jacket', category: 'Outerwear', price: 140 },
  { name: 'Leather Ankle Boots', category: 'Footwear', price: 210 },
  { name: 'White Canvas Sneakers', category: 'Footwear', price: 90 },
  { name: 'Suede Loafers', category: 'Footwear', price: 160 },
];

const pick = (values) => values[Math.floor(Math.random() * values.length)];

/** Minimal PNG encoder: an RGB image with a horizontal accent stripe. */
function placeholderPng([bg, accent], width = 480, height = 600) {
  const row = Buffer.alloc(1 + width * 3); // leading 0 = "no filter" for this scanline
  const rows = [];
  for (let y = 0; y < height; y++) {
    const [r, g, b] = y > height * 0.42 && y < height * 0.58 ? accent : bg;
    for (let x = 0; x < width; x++) row.set([r, g, b], 1 + x * 3);
    rows.push(Buffer.from(row));
  }

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body));
    return Buffer.concat([len, body, crc]);
  };

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit depth, RGB, default compression/filter/interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
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

  // One image per category, reused by its listings.
  const imageUrls = {};
  for (const [category, colours] of Object.entries(PALETTE)) {
    imageUrls[category] = await storageService.saveImage(placeholderPng(colours));
  }

  for (const item of DEMO_ITEMS) {
    await db.transaction(async (tx) => {
      const [cloth] = await tx.insert(clothes).values({
        userId: user.id,
        name: item.name,
        description: `Demo listing: ${item.name.toLowerCase()} in great shape.`,
        price: item.price,
        category: item.category,
        size: item.category === 'Footwear' ? pick(['38', '39', '40', '41', '42']) : pick(['S', 'M', 'L', 'XL']),
        condition: pick(['new', 'good', 'fair']),
        mode: 'sell',
        status: 'active',
        latitude: CENTER.lat + (Math.random() * 0.05 - 0.025),
        longitude: CENTER.lon + (Math.random() * 0.05 - 0.025),
      }).returning();

      await tx.insert(clothingImages).values({ clothingId: cloth.id, url: imageUrls[item.category], isPrimary: true });
    });
  }

  console.log(`[seed] Created ${DEMO_EMAIL} with ${DEMO_ITEMS.length} listings.`);
}

run()
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
