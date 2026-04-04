'use strict';

const { db } = require('../drizzle/db');
const { ratings, notifications, users } = require('../drizzle/schema');
const { eq, desc, avg, count } = require('drizzle-orm');
const AppError = require('../middlewares/AppError');

/**
 * Submit a user rating.
 */
async function submitRating({ raterId, targetUserId, itemId, rating, comment, notificationId }) {
    return await db.transaction(async (tx) => {
        // 1. Create rating record
        const [newRating] = await tx.insert(ratings).values({
            raterId,
            targetUserId,
            itemId: itemId || null,
            rating: parseFloat(rating),
            comment: comment || '',
        }).returning();

        // 2. Mark the triggering notification as completed (if present)
        if (notificationId) {
            await tx.update(notifications)
                .set({ status: 'completed', unread: false })
                .where(eq(notifications.id, notificationId));
        }

        // 3. Notify seller (anonymous feedback)
        await tx.insert(notifications).values({
            userId: targetUserId,
            type: 'rating_received',
            title: 'Recenzie Nouă! ⭐️',
            message: `Ai primit un rating de ${rating} stele pentru unul dintre articolele tale.`,
            itemId: itemId || null,
            unread: true,
            status: 'active'
        });

        // 4. Fire-and-forget aggregate update (non-blocking) - We'll call it outside or handle here
        // For simplicity in SQL, we can do it inside tx or as a separate step
        await updateStatsInternal(tx, targetUserId);

        return newRating;
    });
}

/**
 * Internal helper to update user stats.
 */
async function updateStatsInternal(tx, userId) {
    const [result] = await tx.select({
        avgRating: avg(ratings.rating),
        reviewCount: count(ratings.id),
    })
    .from(ratings)
    .where(eq(ratings.targetUserId, userId));

    await tx.update(users)
        .set({
            rating: parseFloat(parseFloat(result.avgRating || 0).toFixed(1)),
            reviewCount: parseInt(result.reviewCount || 0),
        })
        .where(eq(users.id, userId));
}

/**
 * Get all ratings for a target user.
 */
async function getUserRatings(userId) {
    return await db.query.ratings.findMany({
        where: eq(ratings.targetUserId, userId),
        orderBy: [desc(ratings.createdAt)],
    });
}

module.exports = { submitRating, getUserRatings };
