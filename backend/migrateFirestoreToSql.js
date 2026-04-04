/**
 * DATA MIGRATION SCRIPT (Firestore -> SQL) - VERSION 4 (FIXED RELATIONAL)
 * WearWise 2.0 - ETL Pipeline
 */
const { db: firestore } = require('./config/firebase');
const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const schema = require('./drizzle/schema');
const { users, clothes, clothingImages } = require('./drizzle/schema');
const { eq } = require('drizzle-orm');
require('dotenv').config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const client = postgres(connectionString, { max: 1 });
// IMPORTANT: Pass schema to drizzle for relational queries (findFirst/findMany)
const db = drizzle(client, { schema });

async function migrate() {
  console.log("🚀 Pornim MIGRAREA FINALĂ (Relational Fix)...");
  
  try {
    const snapshot = await firestore.collection('clothes').get();
    const docs = snapshot.docs;
    console.log(`📦 Firestore: ${docs.length} haine.`);

    for (let i = 0; i < docs.length; i++) {
        const data = docs[i].data();
        const fid = docs[i].id;

        try {
            // 1. Sync User
            const authUid = data.userId || 'unknown_user';
            
            // Relational query now works because schema is passed to drizzle()
            let userRecord = await db.query.users.findFirst({
                where: eq(users.authUid, authUid)
            });

            if (!userRecord) {
                console.log(`👤 New User: ${authUid}`);
                const [newUser] = await db.insert(users).values({
                    authUid: authUid,
                    email: `${authUid}@migrated.wearwise`,
                    firstName: 'Migrated',
                    lastName: 'User'
                }).returning();
                userRecord = newUser;
            }

            // 2. Cloth
            const [newCloth] = await db.insert(clothes).values({
                userId: userRecord.id,
                name: data.name || 'Unnamed',
                description: data.description || '',
                price: parseFloat(data.price) || 0,
                category: data.category || 'Other',
                size: data.size || 'N/A',
                condition: data.condition || 'Good',
                mode: data.mode || 'sell',
                latitude: data.latitude || null,
                longitude: data.longitude || null,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
            }).returning();

            // 3. Images
            const images = data.images || (data.image ? [data.image] : []);
            if (images.length > 0) {
                await db.insert(clothingImages).values(
                    images.map((u, idx) => ({
                        clothingId: newCloth.id,
                        url: u,
                        isPrimary: idx === 0
                    }))
                );
            }

            console.log(`[${i+1}/${docs.length}] ✅ ${data.name}`);
        } catch (e) {
            console.error(`[${i+1}/${docs.length}] ❌ ERROR ${fid}: ${e.message}`);
        }
    }
  } catch (err) {
    console.error("💥 CRASH:", err);
  } finally {
    console.log("🏁 GATA!");
    // Give some time for logs to flush
    setTimeout(() => process.exit(0), 1000);
  }
}

migrate();
