'use strict';

const { db } = require('../drizzle/db');
const { users, follows, clothes, clothingImages, notifications } = require('../drizzle/schema');
const { eq, and, ne, desc, lt, inArray, notInArray, sql } = require('drizzle-orm');
const AppError = require('../middlewares/AppError');

/**
 * Get the SQL user row by auth UID.
 */
async function getUserByAuthUid(authUid) {
    const user = await db.query.users.findFirst({
        where: eq(users.authUid, authUid),
    });
    if (!user) throw new AppError('User not found.', 404);
    return user;
}

/**
 * Follow a user.
 * followerAuthUid: the auth UID of the person who is following
 * followedSqlId: the SQL UUID of the person being followed
 */
async function followUser(followerAuthUid, followedSqlId) {
    const follower = await getUserByAuthUid(followerAuthUid);

    if (follower.id === followedSqlId) {
        throw new AppError('Cannot follow yourself.', 400);
    }

    // Check if already following
    const existing = await db.query.follows.findFirst({
        where: and(
            eq(follows.followerId, follower.id),
            eq(follows.followedId, followedSqlId)
        ),
    });

    if (existing) return { alreadyFollowing: true };

    await db.transaction(async (tx) => {
        await tx.insert(follows).values({
            followerId: follower.id,
            followedId: followedSqlId,
        });

        // Increment counts
        await tx.update(users)
            .set({ followingCount: sql`${users.followingCount} + 1` })
            .where(eq(users.id, follower.id));

        await tx.update(users)
            .set({ followersCount: sql`${users.followersCount} + 1` })
            .where(eq(users.id, followedSqlId));

        // Notify the followed user
        const followerName = [follower.firstName, follower.lastName].filter(Boolean).join(' ') || 'Someone';
        await tx.insert(notifications).values({
            userId: followedSqlId,
            type: 'follow',
            title: 'New follower!',
            message: `${followerName} started following you.`,
            sellerId: follower.id, // reused field to store the follower's SQL id for navigation
            unread: true,
        });
    });

    return { success: true };
}

/**
 * Unfollow a user.
 */
async function unfollowUser(followerAuthUid, followedSqlId) {
    const follower = await getUserByAuthUid(followerAuthUid);

    const existing = await db.query.follows.findFirst({
        where: and(
            eq(follows.followerId, follower.id),
            eq(follows.followedId, followedSqlId)
        ),
    });

    if (!existing) return { notFollowing: true };

    await db.transaction(async (tx) => {
        await tx.delete(follows).where(
            and(
                eq(follows.followerId, follower.id),
                eq(follows.followedId, followedSqlId)
            )
        );

        await tx.update(users)
            .set({ followingCount: sql`GREATEST(${users.followingCount} - 1, 0)` })
            .where(eq(users.id, follower.id));

        await tx.update(users)
            .set({ followersCount: sql`GREATEST(${users.followersCount} - 1, 0)` })
            .where(eq(users.id, followedSqlId));
    });

    return { success: true };
}

/**
 * Check if followerAuthUid follows followedSqlId.
 */
async function checkFollowStatus(followerAuthUid, followedSqlId) {
    const follower = await db.query.users.findFirst({
        where: eq(users.authUid, followerAuthUid),
    });
    if (!follower) return { isFollowing: false };

    const existing = await db.query.follows.findFirst({
        where: and(
            eq(follows.followerId, follower.id),
            eq(follows.followedId, followedSqlId)
        ),
    });

    return { isFollowing: !!existing };
}

/**
 * Get followers list for a user (by SQL UUID).
 */
async function getFollowers(userId) {
    const results = await db.query.follows.findMany({
        where: eq(follows.followedId, userId),
        with: { follower: true },
        orderBy: [desc(follows.createdAt)],
        limit: 100,
    });

    return results.map(f => ({
        id: f.follower.id,
        authUid: f.follower.authUid,
        firstName: f.follower.firstName,
        lastName: f.follower.lastName,
        avatarUrl: f.follower.avatarUrl,
        followersCount: f.follower.followersCount,
        followedAt: f.createdAt,
    }));
}

/**
 * Get following list for a user (by SQL UUID).
 */
async function getFollowing(userId) {
    const results = await db.query.follows.findMany({
        where: eq(follows.followerId, userId),
        with: { followed: true },
        orderBy: [desc(follows.createdAt)],
        limit: 100,
    });

    return results.map(f => ({
        id: f.followed.id,
        authUid: f.followed.authUid,
        firstName: f.followed.firstName,
        lastName: f.followed.lastName,
        avatarUrl: f.followed.avatarUrl,
        followersCount: f.followed.followersCount,
        followedAt: f.createdAt,
    }));
}

/**
 * Get suggested users (not yet followed, ordered by followers count).
 */
async function getSuggestedUsers(authUid, limit = 20) {
    const currentUser = await db.query.users.findFirst({
        where: eq(users.authUid, authUid),
    });

    let excludeIds = [];

    if (currentUser) {
        const alreadyFollowing = await db.query.follows.findMany({
            where: eq(follows.followerId, currentUser.id),
            columns: { followedId: true },
        });
        excludeIds = [currentUser.id, ...alreadyFollowing.map(f => f.followedId)];
    }

    // Get users with active items, ordered by followers count
    const suggestedUsers = await db.query.users.findMany({
        where: excludeIds.length > 0
            ? (table) => notInArray(table.id, excludeIds)
            : undefined,
        orderBy: [desc(users.followersCount)],
        limit: parseInt(limit, 10) || 20,
    });

    // Get a preview image for each user
    const result = await Promise.all(
        suggestedUsers.map(async (u) => {
            const firstItem = await db.query.clothes.findFirst({
                where: and(eq(clothes.userId, u.id), eq(clothes.status, 'active')),
                with: { images: true },
                orderBy: [desc(clothes.createdAt)],
            });

            return {
                id: u.id,
                authUid: u.authUid,
                firstName: u.firstName || 'User',
                lastName: u.lastName || '',
                avatarUrl: u.avatarUrl,
                city: u.city,
                followersCount: u.followersCount || 0,
                followingCount: u.followingCount || 0,
                salesCount: u.salesCount || 0,
                previewImage: firstItem?.images?.[0]?.url || null,
            };
        })
    );

    return result;
}

/**
 * Get the items feed from users that authUid follows.
 */
async function getFollowingFeed(authUid, cursor, limit = 10) {
    const pageSize = parseInt(limit, 10) || 10;

    const currentUser = await db.query.users.findFirst({
        where: eq(users.authUid, authUid),
    });

    if (!currentUser) return { items: [], nextCursor: null };

    const following = await db.query.follows.findMany({
        where: eq(follows.followerId, currentUser.id),
        columns: { followedId: true },
    });

    if (following.length === 0) return { items: [], nextCursor: null };

    const followedIds = following.map(f => f.followedId);

    const results = await db.query.clothes.findMany({
        where: (table, { and, eq, lt, inArray }) => {
            const conditions = [
                eq(table.status, 'active'),
                inArray(table.userId, followedIds),
            ];
            if (cursor) conditions.push(lt(table.createdAt, new Date(cursor)));
            return and(...conditions);
        },
        with: { images: true, user: true },
        orderBy: [desc(clothes.createdAt)],
        limit: pageSize + 1,
    });

    const hasMore = results.length > pageSize;
    const items = results.slice(0, pageSize).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        size: item.size,
        condition: item.condition,
        mode: item.mode,
        status: item.status,
        latitude: item.latitude,
        longitude: item.longitude,
        createdAt: item.createdAt,
        userId: item.userId,
        images: item.images?.map(img => img.url) || [],
        primaryImage: item.images?.find(img => img.isPrimary)?.url || item.images?.[0]?.url || null,
        owner: item.user ? {
            id: item.user.id,
            authUid: item.user.authUid,
            firstName: item.user.firstName,
            lastName: item.user.lastName,
            avatarUrl: item.user.avatarUrl,
            rating: item.user.rating,
        } : null,
    }));

    const nextCursor = hasMore ? items[items.length - 1]?.createdAt?.toISOString() : null;
    return { items, nextCursor };
}

/**
 * Get public profile by SQL UUID.
 */
async function getPublicProfile(userId) {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    if (!user) throw new AppError('User not found.', 404);

    const activeItems = await db.query.clothes.findMany({
        where: and(eq(clothes.userId, user.id), eq(clothes.status, 'active')),
        with: { images: true },
        orderBy: [desc(clothes.createdAt)],
        limit: 50,
    });

    return {
        id: user.id,
        authUid: user.authUid,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        city: user.city,
        rating: user.rating,
        reviewCount: user.reviewCount,
        salesCount: user.salesCount,
        tradesCount: user.tradesCount,
        donationsCount: user.donationsCount,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        items: activeItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            category: item.category,
            size: item.size,
            condition: item.condition,
            mode: item.mode,
            status: item.status,
            images: item.images?.map(img => img.url) || [],
            primaryImage: item.images?.find(img => img.isPrimary)?.url || item.images?.[0]?.url || null,
            createdAt: item.createdAt,
        })),
    };
}

/**
 * Search users by name.
 */
async function searchUsers(query, limit = 20) {
    const searchTerm = `%${query.toLowerCase()}%`;

    const results = await db.execute(
        // Name only: matching on email would let anyone probe which addresses have accounts.
        sql`SELECT id, auth_uid, first_name, last_name, avatar_url, city, followers_count, following_count, sales_count
            FROM users
            WHERE LOWER(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) LIKE ${searchTerm}
            ORDER BY followers_count DESC
            LIMIT ${parseInt(limit, 10) || 20}`
    );

    return results.map(u => ({
        id: u.id,
        authUid: u.auth_uid,
        firstName: u.first_name || 'User',
        lastName: u.last_name || '',
        avatarUrl: u.avatar_url,
        city: u.city,
        followersCount: u.followers_count || 0,
        followingCount: u.following_count || 0,
        salesCount: u.sales_count || 0,
    }));
}

module.exports = {
    followUser,
    unfollowUser,
    checkFollowStatus,
    getFollowers,
    getFollowing,
    getSuggestedUsers,
    getFollowingFeed,
    getPublicProfile,
    searchUsers,
};
