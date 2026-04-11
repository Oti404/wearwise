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
 * Register a new user profile in PostgreSQL.
 */
async function registerUser(uid, data) {
    // Check if user already exists
    const existing = await db.query.users.findFirst({
        where: eq(users.authUid, uid),
    });

    if (existing) {
        // During registration, a race condition often occurs where GET /user/:id auto-syncs the user first.
        // If it exists, we MUST update the row with the newly filled registration form data.
        const [updatedUser] = await db.update(users)
            .set({
                firstName: data.firstName || existing.firstName,
                lastName: data.lastName || existing.lastName,
                phone: data.phone || existing.phone,
                city: data.city || existing.city,
                updatedAt: new Date(),
            })
            .where(eq(users.authUid, uid))
            .returning();
        return updatedUser;
    }

    const [newUser] = await db.insert(users).values({
        authUid: uid,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        city: data.city || null,
    }).returning();

    return newUser;
}

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

module.exports = { registerUser, getUserByIdentifier, updateUser };
