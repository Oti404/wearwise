'use strict';

/**
 * AUTH SERVICE — email/password accounts stored in our own Postgres.
 * Password hashes live in `user_credentials`, never in `users`, so profile
 * queries elsewhere cannot leak them.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');

const { db } = require('../drizzle/db');
const { users, userCredentials } = require('../drizzle/schema');
const AppError = require('../middlewares/AppError');
const { jwtSecret, jwtExpiresIn, jwtAlgorithm, bcryptCost } = require('../config/auth');

// Compared against when the email is unknown, so login takes the same time
// whether or not the account exists (prevents user enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', bcryptCost);

const INVALID_CREDENTIALS = 'Invalid email or password.';

function signToken(user) {
  return jwt.sign({ sub: user.authUid, email: user.email }, jwtSecret, {
    algorithm: jwtAlgorithm,
    expiresIn: jwtExpiresIn,
  });
}

/**
 * @returns {{ sub: string, email: string }} Decoded payload
 * @throws {AppError} 401 when the token is invalid or expired
 */
function verifyAuthToken(token) {
  try {
    return jwt.verify(token, jwtSecret, { algorithms: [jwtAlgorithm] });
  } catch {
    throw new AppError('Invalid or expired token.', 401);
  }
}

async function register({ email, password, firstName, lastName, phone, city }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const passwordHash = await bcrypt.hash(password, bcryptCost);
  // auth_uid mirrors id so existing services that look users up by authUid keep working.
  const id = crypto.randomUUID();

  try {
    return await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({
        id,
        authUid: id,
        email: normalizedEmail,
        firstName,
        lastName,
        phone: phone || null,
        city: city || null,
      }).returning();

      await tx.insert(userCredentials).values({ userId: user.id, passwordHash });

      return { user, token: signToken(user) };
    });
  } catch (err) {
    // Two concurrent sign-ups with the same email: the unique index wins the race.
    if (err.code === '23505') throw new AppError('An account with this email already exists.', 409);
    throw err;
  }
}

async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const [row] = await db
    .select({ user: users, passwordHash: userCredentials.passwordHash })
    .from(users)
    .innerJoin(userCredentials, eq(userCredentials.userId, users.id))
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const passwordOk = await bcrypt.compare(password, row?.passwordHash ?? DUMMY_HASH);
  if (!row || !passwordOk) throw new AppError(INVALID_CREDENTIALS, 401);

  return { user: row.user, token: signToken(row.user) };
}

async function getCurrentUser(authUid) {
  const user = await db.query.users.findFirst({ where: eq(users.authUid, authUid) });
  // Token is valid but the account was deleted since it was issued.
  if (!user) throw new AppError('Account not found.', 401);
  return user;
}

module.exports = { register, login, getCurrentUser, verifyAuthToken };
