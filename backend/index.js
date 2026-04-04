const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/ping', (req, res) => res.send('pong'));

// Initialize Firebase Admin
let db;
try {
  // Option 1: Try local JSON file (Development)
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized with service account.');
} catch (error) {
  // Option 2: Environment Variables (Production)
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    });
    console.log('Firebase initialized with Environment Variables.');
  } else {
    console.warn('⚠️ Firebase Admin NOT initialized. Please add serviceAccountKey.json OR set FIREBASE_ environment variables.');
    // Check for just Project ID fallback (limited functionality)
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('Firebase initialized with Project ID fallback (Read-only or limited).');
    }
  }
}

if (admin.apps.length > 0) {
  db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
}

// Endpoint: Check Phone Uniqueness & Register User Data
app.post('/register', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Backend-ul nu este configurat. Lipsește serviceAccountKey.json.' });
  }
  const { uid, firstName, lastName, email, phone, country, city, address, latitude, longitude } = req.body;

  if (!uid || !phone) {
    return res.status(400).json({ error: 'UID and Phone are required.' });
  }

  try {
    // 1. Check if phone exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('phone', '==', phone).get();

    if (!snapshot.empty) {
      return res.status(400).json({ error: 'Acest număr de telefon este deja folosit.' });
    }

    // 2. Save user data
    const userData = {
      uid,
      firstName,
      lastName,
      email,
      phone,
      country,
      city,
      address,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await usersRef.doc(uid).set(userData);

    res.status(201).json({ message: 'User registered successfully', userData });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Get User Profile by Identifier (Email, UID or Phone) - SQL HYBRID (WearWise 2.0)
app.get('/user/:identifier', async (req, res) => {
  const { identifier } = req.params;
  const { db: sqlDb } = require('./drizzle/db');
  const { users } = require('./drizzle/schema');
  const { eq, or } = require('drizzle-orm');

  try {
    // 1. Try finding in SQL first
    let user = await sqlDb.query.users.findFirst({
      where: or(
        eq(users.authUid, identifier),
        eq(users.email, identifier),
        eq(users.phone, identifier)
      )
    });

    // 2. Fallback to Firestore & Auto-Sync
    if (!user && db) {
      console.log(`[SQL AUTO-SYNC] 👤 Looking up profile in Firestore: ${identifier}`);
      const usersRef = db.collection('users');
      let firestoreDoc;

      const docById = await usersRef.doc(identifier).get();
      if (docById.exists) {
        firestoreDoc = docById;
      } else {
        const queryField = identifier.includes('@') ? 'email' : 'phone';
        const snapshot = await usersRef.where(queryField, '==', identifier).limit(1).get();
        if (!snapshot.empty) firestoreDoc = snapshot.docs[0];
      }

      if (firestoreDoc) {
        const d = firestoreDoc.data();
        console.log(`[SQL AUTO-SYNC] Profile found in Firestore, creating SQL record...`);
        
        try {
          const [newUser] = await sqlDb.insert(users).values({
            authUid: d.uid || d.id || identifier,
            email: d.email || `${identifier}@migrated.wearwise`,
            firstName: d.firstName || 'User',
            lastName: d.lastName || 'Migrated',
            phone: d.phone || null,
            city: d.city || null,
            avatarUrl: d.avatarUrl || null
          }).returning();
          user = newUser;
        } catch (e) {
          console.warn('[SQL AUTO-SYNC] Conflict or error during user insert:', e.message);
          // Try to fetch again in case it was created concurrently
          user = await sqlDb.query.users.findFirst({
            where: eq(users.authUid, d.uid || identifier)
          });
        }
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'Utilizatorul nu a fost găsit în niciun sistem.' });
    }

    res.json(user);
  } catch (error) {
    console.error('[SQL API] Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});



// Endpoint: Update User Profile
app.patch('/user/:uid', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Backend-ul nu este configurat.' });
  }
  const { uid } = req.params;
  const updates = req.body;

  try {
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Utilizatorul nu a fost găsit.' });
    }

    await userRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await userRef.get();
    res.json(updatedDoc.data());
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Add new clothing item
// Endpoint: Add new clothing article - SQL POWERED (WearWise 2.0)
app.post('/clothes', async (req, res) => {
  const {
    userId, name, description, images, category,
    size, condition, mode, price, latitude, longitude
  } = req.body;

  const clothesSqlService = require('./services/clothesSqlService');
  const { db: sqlDb } = require('./drizzle/db');
  const { users } = require('./drizzle/schema');
  const { eq } = require('drizzle-orm');

  // Validation
  if (!userId || !name || !mode) {
    return res.status(400).json({ error: 'Numele, utilizatorul și modul de listare sunt obligatorii.' });
  }

  try {
    // 1. Asigurăm existența profilului SQL (Sync on-the-fly)
    let user = await sqlDb.query.users.findFirst({
      where: eq(users.authUid, userId)
    });

    if (!user) {
      console.log(`[SQL AUTO-SYNC] 👤 Creating missing profile for: ${userId}`);
      // Încercăm să luăm date din Firestore dacă avem db inițializat
      let email = `${userId}@wearwise.app`;
      let firstName = 'User';
      let lastName = 'New';
      
      if (db) {
        const firestoreUser = await db.collection('users').doc(userId).get();
        if (firestoreUser.exists) {
          const d = firestoreUser.data();
          email = d.email || email;
          firstName = d.firstName || firstName;
          lastName = d.lastName || lastName;
        }
      }

      const [newUser] = await sqlDb.insert(users).values({
        authUid: userId,
        email,
        firstName,
        lastName
      }).returning();
      user = newUser;
    }

    // 2. Inserăm haina în SQL
    const newCloth = await clothesSqlService.createCloth({
      userId: user.id,
      name,
      description: description || '',
      category: category || 'Other',
      size: size || 'N/A',
      condition: condition || 'Good',
      mode,
      price: (mode === 'trade' || mode === 'donate') ? null : parseFloat(price),
      latitude: latitude || null,
      longitude: longitude || null
    }, images || []);

    res.status(201).json({ id: newCloth.id, ...newCloth });
  } catch (error) {
    console.error('[SQL API] ❌ Error adding clothes:', error);
    res.status(500).json({ error: 'Eroare la salvarea hainei în baza de date SQL.' });
  }
});

// Endpoint: AI Analysis Proxy
app.post('/ai/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    console.error('[AI Proxy] No file received in request');
    return res.status(400).json({ error: 'Image file is required.' });
  }

  console.log(`[AI Proxy] Received file: ${req.file.originalname} (${req.file.size} bytes)`);

  try {
    const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
    console.log(`[AI Proxy] Forwarding buffer to AI Engine at: ${AI_ENGINE_URL}/classify/file`);
    
    // Preparation for Forwarding
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'upload.jpg',
      contentType: req.file.mimetype,
    });

    console.log(`[AI Proxy] Sending request to AI Engine...`);
    const response = await axios.post(`${AI_ENGINE_URL}/classify/file`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    console.log(`[AI Proxy] SUCCESS: AI Engine responded with:`, JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error('[AI Proxy Error] Link failed:', error.message);
    if (error.response) {
      console.error('[AI Proxy Error] AI Engine detail:', error.response.data);
    }
    // Fallback error
    res.status(503).json({ error: 'AI Service currently unavailable.' });
  }
});

// Endpoint: Get all active clothes (Explore Feed) - SQL POWERED (WearWise 2.0)
app.get('/clothes', async (req, res) => {
  const { excludeUser, cursor, limit } = req.query;
  const clothesSqlService = require('./services/clothesSqlService');

  try {
    const { items, nextCursor } = await clothesSqlService.getClothesPage({
      excludeUser,
      cursor,
      limit
    });

    res.json({ items, nextCursor });
  } catch (error) {
    console.error('[API] ❌ Error fetching clothes from SQL:', error);
    res.status(500).json({ error: 'Eroare la aducerea hainelor din baza de date SQL.' });
  }
});

// Endpoint: Get specific clothing article
app.get('/clothes/:id', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Backend-ul nu este configurat.' });

  const { id } = req.params;
  console.log(`🔍 [Backend] Se caută haina cu ID: ${id}`);

  try {
    const docRef = db.collection('clothes').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`❌ [Backend] Haina ${id} NU EXISTĂ în Firestore.`);
      return res.status(404).json({ error: 'Haina nu a fost găsită.' });
    }

    const data = doc.data();
    console.log(`✅ [Backend] Haina găsită: ${data.name} (Status: ${data.status})`);

    if (data.status === 'deleted') {
      return res.status(404).json({ error: 'Acest articol a fost șters.' });
    }

    // Attach owner info
    let ownerInfo = null;
    try {
      const ownerDoc = await db.collection('users').doc(data.userId).get();
      if (ownerDoc.exists) {
        const ownerData = ownerDoc.data();
        ownerInfo = {
          firstName: ownerData.firstName,
          lastName: ownerData.lastName,
          avatarUrl: ownerData.avatarUrl,
        };
      }
    } catch (err) {
      console.error('Error fetching owner info:', err);
    }

    res.json({
      id: doc.id,
      ...data,
      owner: ownerInfo
    });
  } catch (error) {
    console.error(`🔥 [Backend] Eroare la fetch haine ${id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Get user closet (Owned + Bought items)
app.get('/user-closet/:userId', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Backend-ul nu este configurat.' });
  const { userId } = req.params;

  try {
    // We need to fetch items where the user is either the OWNER or the BUYER
    const ownedSnapshot = await db.collection('clothes')
      .where('userId', '==', userId)
      .get();

    const boughtSnapshot = await db.collection('clothes')
      .where('buyerId', '==', userId)
      .get();

    const clothes = [];

    ownedSnapshot.forEach(doc => {
      const data = doc.data();
      // Hide sold items from the original owner's closet
      if (data.status !== 'deleted' && data.status !== 'sold') {
        clothes.push({ id: doc.id, ...data });
      }
    });

    boughtSnapshot.forEach(doc => {
      const data = doc.data();
      // Avoid duplicates if buyer is owner (unlikely but safe)
      if (!clothes.some(c => c.id === doc.id) && data.status !== 'deleted') {
        clothes.push({ id: doc.id, ...data });
      }
    });

    // Sort by creation date
    clothes.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });

    res.json(clothes);
  } catch (error) {
    console.error('Error fetching closet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Checkout (Process Purchase)
app.post('/checkout', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Backend-ul nu este configurat.' });

  const { userId, items } = req.body; // items is an array of IDs

  if (!userId || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Date invalide pentru checkout.' });
  }

  try {
    const batch = db.batch();
    const clothesRef = db.collection('clothes');
    const notifRef = db.collection('notifications');

    for (const itemId of items) {
      const docRef = clothesRef.doc(itemId);
      const itemDoc = await docRef.get();

      if (!itemDoc.exists) continue;
      const itemData = itemDoc.data();

      // Mark item as sold
      batch.update(docRef, {
        status: 'sold',
        buyerId: userId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 1. Notify Seller: Someone bought your item!
      const sellerNotif = notifRef.doc();
      batch.set(sellerNotif, {
        userId: itemData.userId, // The owner
        type: 'sale_notification',
        title: 'Articol Vândut! 🎉',
        message: `Felicitări! Ai vândut '${itemData.name}'.`,
        itemId: itemId,
        unread: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Notify Buyer: Please rate the seller/item
      const buyerNotif = notifRef.doc();
      batch.set(buyerNotif, {
        userId: userId, // The buyer
        type: 'rating_request',
        title: 'Evaluează achiziția ⭐️',
        message: `Cum a fost experiența cu '${itemData.name}'? Lasă un rating vânzătorului.`,
        itemId: itemId,
        sellerId: itemData.userId,
        unread: true,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Update Seller Stats
      const sellerRef = db.collection('users').doc(itemData.userId);
      const statUpdate = {};
      if (itemData.mode === 'donate') {
        statUpdate.donationsCount = admin.firestore.FieldValue.increment(1);
      } else if (itemData.mode === 'trade') {
        statUpdate.tradesCount = admin.firestore.FieldValue.increment(1);
      } else {
        statUpdate.salesCount = admin.firestore.FieldValue.increment(1);
      }
      batch.update(sellerRef, statUpdate);
    }

    await batch.commit();
    res.json({ success: true, message: 'Comanda a fost procesată cu succes.' });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Get user notifications
app.get('/notifications/:userId', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Backend-ul nu este configurat.' });
  const { userId } = req.params;

  try {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .get();

    let notifications = [];
    snapshot.forEach(doc => {
      notifications.push({ id: doc.id, ...doc.data() });
    });

    // Sort in memory to avoid needing a composite index for where + orderBy
    notifications.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });

    // Apply limit manually
    res.json(notifications.slice(0, 50));
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Submit a rating
app.post('/ratings', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Backend-ul nu este configurat.' });

  const { raterId, targetUserId, itemId, rating, comment, notificationId } = req.body;

  if (!raterId || !targetUserId || !rating) {
    return res.status(400).json({ error: 'Rating-ul și ID-urile sunt obligatorii.' });
  }

  try {
    const batch = db.batch();
    const ratingRef = db.collection('ratings').doc();

    // 1. Create rating record
    batch.set(ratingRef, {
      raterId,
      targetUserId,
      itemId,
      rating: parseFloat(rating),
      comment: comment || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. If it comes from a notification, mark it as handled
    if (notificationId) {
      const notifRef = db.collection('notifications').doc(notificationId);
      batch.update(notifRef, { status: 'completed', unread: false });
    }

    // 3. Notify Seller: Anonymous feedback received
    const sellerNotif = db.collection('notifications').doc();
    batch.set(sellerNotif, {
      userId: targetUserId,
      type: 'rating_received',
      title: 'Recenzie Nouă! ⭐️',
      message: `Ai primit un rating de ${rating} stele pentru unul dintre articolele tale.`,
      itemId: itemId || null,
      rating: parseFloat(rating),
      unread: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // 3. (Async) Update user aggregate rating for profile quick access
    // This is optional but improves profile load time
    updateUserAggregateRating(targetUserId);

    res.json({ success: true, message: 'Rating trimis cu succes!' });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Get user ratings
app.get('/user-ratings/:userId', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Backend-ul nu este configurat.' });
  const { userId } = req.params;

  try {
    const snapshot = await db.collection('ratings')
      .where('targetUserId', '==', userId)
      .get();

    const ratings = [];
    snapshot.forEach(doc => {
      ratings.push({ id: doc.id, ...doc.data() });
    });

    // Sort in memory to avoid "missing index" error in development
    ratings.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });

    res.json(ratings);
  } catch (error) {
    console.error('Fetch ratings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Updates the user average rating and total reviews in their document
 */
async function updateUserAggregateRating(userId) {
  try {
    const snapshot = await db.collection('ratings').where('targetUserId', '==', userId).get();
    let totalScore = 0;
    let count = 0;

    snapshot.forEach(doc => {
      totalScore += doc.data().rating;
      count++;
    });

    const average = count > 0 ? totalScore / count : 0;

    await db.collection('users').doc(userId).update({
      rating: parseFloat(average.toFixed(1)),
      reviewCount: count,
    });
    console.log(`[Backend] Updated rating for ${userId}: ${average} (${count} reviews)`);
  } catch (err) {
    console.error('Error updating aggregate rating:', err);
  }
}


// Endpoint: Re-list a bought item (Resell)
app.post('/re-list', async (req, res) => {
  if (!db) return res.status(500).json({ error: 'Backend-ul nu este configurat.' });

  const { userId, itemId, updates } = req.body; // updates is optional object

  if (!userId || !itemId) {
    return res.status(400).json({ error: 'Date invalide pentru re-listare.' });
  }

  try {
    const docRef = db.collection('clothes').doc(itemId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Articolul nu există.' });
    }

    const item = doc.data();

    // Verification: Only the person who BOUGHT the item can re-list it
    if (item.buyerId !== userId) {
      return res.status(403).json({ error: 'Doar persoana care a cumpărat articolul îl poate re-lista.' });
    }

    // Process Ownership Transfer + Updates
    const updatePayload = {
      userId: userId,    // Transfer ownership to the buyer
      buyerId: null,      // It's no longer "bought" but "owned"
      status: 'active',   // Re-activate for swipe feed
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(updates || {})  // Apply price, description, etc.
    };

    await docRef.update(updatePayload);

    res.json({ success: true, message: 'Articolul a fost re-listat cu succes!' });
  } catch (error) {
    console.error('Re-list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trebuie să asculte de process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serverul rulează pe portul ${PORT}`);
});
