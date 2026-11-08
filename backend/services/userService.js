'use strict';

/**
 * USER SERVICE SQL — WearWise 2.0
 * Profile reads and updates; account creation and login live in authService.
 */

const { db } = require('../drizzle/db');
const { users } = require('../drizzle/schema');
const { eq, or } = require('drizzle-orm');
const AppError = require('../middlewares/AppError');

/**
 * Get user by auth UID, email, or phone.
 */
async function getUserByIdentifier(identifier) {
    let user = await db.query.users.findFirst({
        where: eq(users.authUid, identifier),
    });

    if (!user && identifier.includes('@')) {
        user = await db.query.users.findFirst({
            where: eq(users.email, identifier),
        });
    }

    if (!user && !identifier.includes('@')) {
        user = await db.query.users.findFirst({
            where: eq(users.phone, identifier),
        });
    }

    if (!user) throw new AppError('Utilizatorul nu a fost găsit.', 404);
    return user;
}

/**
 * Update user profile fields.
 */
async function updateUser(uid, updates) {
    const existing = await db.query.users.findFirst({
        where: eq(users.authUid, uid),
    });
    if (!existing) throw new AppError('Utilizatorul nu a fost găsit.', 404);

    const [updated] = await db.update(users)
        .set({
            firstName: updates.firstName ?? existing.firstName,
            lastName: updates.lastName ?? existing.lastName,
            phone: updates.phone ?? existing.phone,
            city: updates.city ?? existing.city,
            avatarUrl: updates.avatarUrl ?? existing.avatarUrl,
            updatedAt: new Date(),
        })
        .where(eq(users.authUid, uid))
        .returning();

    return updated;
}

module.exports = { getUserByIdentifier, updateUser };
