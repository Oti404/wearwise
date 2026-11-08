'use strict';

/**
 * CLOTHES SQL SERVICE — WearWise 2.0
 * All data operations go through Drizzle ORM → PostgreSQL.
 */

const { db } = require('../drizzle/db');
const { clothes, clothingImages, users } = require('../drizzle/schema');
const { eq, desc, ne, and, lt, or } = require('drizzle-orm');
const AppError = require('../middlewares/AppError');

/**
 * GET paginated active clothes feed.
 */
async function getClothesPage({ excludeUser, cursor, limit = 10 } = {}) {
    const pageSize = parseInt(limit, 10) || 10;

    try {
        const results = await db.query.clothes.findMany({
            where: (table, { and, eq, ne, lt }) => {
                const conditions = [eq(table.status, 'active')];
                if (cursor) conditions.push(lt(table.createdAt, new Date(cursor)));
                return and(...conditions);
            },
            with: {
                images: true,
                user: true,
            },
            orderBy: [desc(clothes.createdAt)],
            limit: pageSize + 1,
        });

        // Filter out user's own items after fetch (simple approach)
        let filtered = results;
        if (excludeUser) {
            filtered = results.filter(item => item.user?.authUid !== excludeUser);
        }

        const hasMore = filtered.length > pageSize;
        const items = filtered.slice(0, pageSize).map(item => ({
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
                followersCount: item.user.followersCount || 0,
            } : null,
        }));

        const nextCursor = hasMore ? items[items.length - 1]?.createdAt?.toISOString() : null;
        return { items, nextCursor };

    } catch (error) {
        console.error('[SQL] ❌ getClothesPage error:', error.message);
        throw error;
    }
}

/**
 * GET single clothes item by ID.
 */
async function getClothesById(id) {
    const item = await db.query.clothes.findFirst({
        where: eq(clothes.id, id),
        with: { images: true, user: true },
    });

    if (!item) throw new AppError('Item not found.', 404);
    if (item.status === 'deleted') throw new AppError('This item has been deleted.', 404);

    return {
        ...item,
        images: item.images?.map(img => img.url) || [],
        primaryImage: item.images?.find(img => img.isPrimary)?.url || item.images?.[0]?.url || null,
        owner: item.user ? {
            firstName: item.user.firstName,
            lastName: item.user.lastName,
            avatarUrl: item.user.avatarUrl,
            rating: item.user.rating,
        } : null,
    };
}

/**
 * GET user's closet — items they own (active).
 */
async function getUserCloset(authUid) {
    const user = await db.query.users.findFirst({
        where: eq(users.authUid, authUid),
    });

    if (!user) return [];

    const results = await db.query.clothes.findMany({
        where: and(
            or(eq(clothes.userId, user.id), eq(clothes.buyerId, user.id)),
            ne(clothes.status, 'deleted')
        ),
        with: { images: true },
        orderBy: [desc(clothes.createdAt)],
    });

    return results.map(item => ({
        ...item,
        images: item.images?.map(img => img.url) || [],
        primaryImage: item.images?.find(img => img.isPrimary)?.url || item.images?.[0]?.url || null,
    }));
}

/**
 * CREATE a new clothes item with images.
 * authUid = users.auth_uid from the verified token.
 */
async function createClothesItem(authUid, data) {
    const sqlUser = await db.query.users.findFirst({
        where: eq(users.authUid, authUid),
    });
    // Every token belongs to a registered user, so a miss means the account was deleted.
    if (!sqlUser) throw new AppError('User not found.', 404);

    // Images are uploaded beforehand via POST /uploads; only their URLs arrive here.
    const imageUrls = data.images || [];

    return await db.transaction(async (tx) => {
        const [newCloth] = await tx.insert(clothes).values({
            userId: sqlUser.id,
            name: data.name,
            description: data.description || null,
            price: parseFloat(data.price),
            category: data.category,
            size: data.size,
            condition: data.condition,
            mode: data.mode,
            status: 'active',
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
        }).returning();

        if (imageUrls.length > 0) {
            const imageRecords = imageUrls.map((url, index) => ({
                clothingId: newCloth.id,
                url,
                isPrimary: index === 0,
            }));
            await tx.insert(clothingImages).values(imageRecords);
        }

        return newCloth;
    });
}

/**
 * Mark an item as sold (by owner).
 */
async function markAsSold(itemId, ownerAuthUid) {
    const user = await db.query.users.findFirst({
        where: eq(users.authUid, ownerAuthUid),
    });
    if (!user) throw new AppError('User not found.', 404);

    const item = await db.query.clothes.findFirst({
        where: and(eq(clothes.id, itemId), eq(clothes.userId, user.id)),
    });
    if (!item) throw new AppError('Item not found or you are not the owner.', 404);
    if (item.status === 'sold') throw new AppError('Item is already marked as sold.', 400);

    const { sql: sqlExpr } = require('drizzle-orm');

    await db.transaction(async (tx) => {
        await tx.update(clothes)
            .set({ status: 'sold' })
            .where(eq(clothes.id, itemId));

        await tx.update(users)
            .set({ salesCount: sqlExpr`${users.salesCount} + 1` })
            .where(eq(users.id, user.id));
    });

    return { success: true, itemId };
}

module.exports = { getClothesPage, getClothesById, getUserCloset, createClothesItem, markAsSold };
