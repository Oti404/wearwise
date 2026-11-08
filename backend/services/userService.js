'use strict';

/**
 * USER SERVICE SQL — WearWise 2.0
 * Profile reads and updates; account creation and login live in authService.
 */

const { db } = require('../drizzle/db');
const { users } = require('../drizzle/schema');
const { eq } = require('drizzle-orm');
const AppError = require('../middlewares/AppError');

/**
 * Get a user by auth UID. Lookups by email or phone are deliberately not supported here:
 * a public endpoint that accepts them lets anyone check which emails/phones have accounts.
 */
async function getUserByUid(uid) {
    const user = await db.query.users.findFirst({
        where: eq(users.authUid, uid),
    });
    if (!user) throw new AppError('User not found.', 404);
    return user;
}

/**
 * Profile fields that are safe to show to anyone (no email, phone or internal counters).
 */
function toPublicProfile(user) {
    return {
        id: user.id,
        uid: user.authUid,
        authUid: user.authUid,
        firstName: user.firstName,
        lastName: user.lastName,
        city: user.city,
        avatarUrl: user.avatarUrl,
        rating: user.rating,
        reviewCount: user.reviewCount,
        salesCount: user.salesCount,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        createdAt: user.createdAt,
    };
}

/**
 * Update user profile fields.
 */
async function updateUser(uid, updates) {
    const existing = await db.query.users.findFirst({
        where: eq(users.authUid, uid),
    });
    if (!existing) throw new AppError('User not found.', 404);

    // Phones are a sign-in identifier, so a change must not collide with another account.
    if (updates.phone && updates.phone !== existing.phone) {
        const taken = await db.query.users.findFirst({ where: eq(users.phone, updates.phone) });
        if (taken) throw new AppError('An account with this phone number already exists.', 409);
    }

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

module.exports = { getUserByUid, toPublicProfile, updateUser };
