/**
 * AUTH MIDDLEWARE (WearWise 2.0)
 * Asigură că fiecare user autentificat prin Firebase are un profil corespondent în SQL.
 */
const { db } = require('../drizzle/db');
const { users } = require('../drizzle/schema');
const { eq } = require('drizzle-orm');

const syncUserToSql = async (req, res, next) => {
  const firebaseUser = req.user; // Setat anterior de middleware-ul de auth principal
  if (!firebaseUser) return next();

  try {
    // Verificăm dacă user-ul există deja în SQL
    const existingUser = await db.query.users.findFirst({
      where: eq(users.authUid, firebaseUser.uid)
    });

    if (!existingUser) {
      console.log(`[SQL SYNC] 👤 Syncing new user: ${firebaseUser.email}`);
      await db.insert(users).values({
        authUid: firebaseUser.uid,
        email: firebaseUser.email,
        firstName: firebaseUser.name?.split(' ')[0] || '',
        lastName: firebaseUser.name?.split(' ')[1] || '',
        avatarUrl: firebaseUser.picture || ''
      });
    }
    
    // Atașăm ID-ul SQL la request pentru a fi folosit în servicii ulterior
    req.sqlUserId = existingUser ? existingUser.id : null;
    
    next();
  } catch (error) {
    console.error("[SQL SYNC] ❌ Error syncing user:", error);
    next(); // Mergem mai departe oricum, dar logăm eroarea
  }
};

module.exports = { syncUserToSql };
