'use strict';

/**
 * USER SERVICE SQL — WearWise 2.0
 * All user operations and authentication go through Supabase.
 */

const { db } = require('../drizzle/db');
const { users } = require('../drizzle/schema');
const { eq, or } = require('drizzle-orm');
const AppError = require('../middlewares/AppError');
const { supabase } = require('../config/supabase');

/**
 * Get user by Firebase UID, email, or phone.
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

    // Auto-sync: if not in SQL but exists in Supabase Auth, create profile
    if (!user) {
        try {
            const { data: { user: sbUser }, error } = await supabase.auth.admin.getUserById(identifier);
            if (sbUser && !error) {
                const [created] = await db.insert(users).values({
                    authUid: sbUser.id,
                    email: sbUser.email || `${sbUser.id}@unknown.com`,
                    firstName: sbUser.user_metadata?.first_name || 'User',
                    lastName: sbUser.user_metadata?.last_name || '',
                }).returning();
                user = created;
            }
        } catch {
            throw new AppError('Utilizatorul nu a fost găsit.', 404);
        }
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
