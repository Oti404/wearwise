'use strict';

const { db } = require('../drizzle/db');
const { ratings, notifications, users } = require('../drizzle/schema');
const { eq, and, desc, avg, count } = require('drizzle-orm');
const AppError = require('../middlewares/AppError');

/**
 * Submit a rating for a completed purchase.
 * The rating must answer a pending `rating_request` notification owned by the rater; the seller
 * and item come from that notification, so nobody can rate someone they never bought from,
 * rate on another user's behalf, or rate the same purchase twice.
 */
async function submitRating(raterAuthUid, { notificationId, rating, comment }) {
    const rater = await db.query.users.findFirst({ where: eq(users.authUid, raterAuthUid) });
    if (!rater) throw new AppError('User not found.', 404);

    return await db.transaction(async (tx) => {
        // Claiming the request with a conditional update makes concurrent double submissions impossible.
        const [request] = await tx.update(notifications)
            .set({ status: 'completed', unread: false })
            .where(and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, rater.id),
                eq(notifications.type, 'rating_request'),
                eq(notifications.status, 'pending'),
            ))
            .returning();

        if (!request) throw new AppError('This rating request does not exist or was already answered.', 404);
        if (!request.sellerId || request.sellerId === rater.id) {
            throw new AppError('This purchase cannot be rated.', 400);
        }

        const [newRating] = await tx.insert(ratings).values({
            raterId: rater.id,
            targetUserId: request.sellerId,
            itemId: request.itemId,
            rating: parseFloat(rating),
            comment: comment || '',
        }).returning();

        // Notify the seller (the rater stays anonymous).
        await tx.insert(notifications).values({
            userId: request.sellerId,
            type: 'rating_received',
            title: 'New review',
            message: `You received a ${rating}-star rating for one of your items.`,
            itemId: request.itemId,
            unread: true,
            status: 'active',
        });

        await updateStatsInternal(tx, request.sellerId);

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
