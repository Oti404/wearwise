const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function seed() {
  console.log('🚀 SEED: Inserare haina TECHWEAR în SQL...');
  try {
    // 1. User
    const users = await sql`
      INSERT INTO users (auth_uid, email, first_name, last_name) 
      VALUES ('system_seed_user', 'seed@wearwise.app', 'System', 'Seed') 
      ON CONFLICT (auth_uid) DO UPDATE SET email = EXCLUDED.email 
      RETURNING id
    `;
    const userId = users[0].id;

    // 2. Cloth
    const clothes = await sql`
      INSERT INTO clothes (user_id, name, description, price, category, size, condition, mode, status) 
      VALUES (${userId}, 'Hanorac TechWear WearWise 2.0', 'Ediție limitată SQL Master Plan.', 299, 'Hoodies', 'L', 'New', 'sell', 'active') 
      RETURNING id
    `;
    const clothId = clothes[0].id;

    // 3. Image
    await sql`
      INSERT INTO clothing_images (clothing_id, url, is_primary) 
      VALUES (${clothId}, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800', true)
    `;

    console.log('✅ SUCCESS: Haina a fost adăugată!');
    console.log('ID SQL:', clothId);
  } catch (err) {
    console.error('❌ EROARE:', err.message);
  } finally {
    await sql.end();
    process.exit();
  }
}

seed();
