'use strict';

const { db } = require('../drizzle/db');
const { clothes, notifications, users } = require('../drizzle/schema');
const { eq, ne, and, sql } = require('drizzle-orm');
const AppError = require('../middlewares/AppError');

/**
 * processCheckout – Handles purchase of one or more items.
 */
async function processCheckout(buyerAuthUid, items) {
    // 1. Find buyer SQL ID
    const buyer = await db.query.users.findFirst({
        where: eq(users.authUid, buyerAuthUid),
    });
    if (!buyer) throw new AppError('Buyer not found.', 404);

    return await db.transaction(async (tx) => {
        const purchasedItemIds = [];

        // Duplicate ids in one cart would otherwise make the order fail on its own second copy.
        for (const itemId of [...new Set(items)]) {
            // Claim the item atomically: the status check and the update are one statement, so two
            // simultaneous checkouts can never both succeed (the loser updates zero rows).
            const [item] = await tx.update(clothes)
                .set({
                    status: 'sold',
                    buyerId: buyer.id,
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(clothes.id, itemId),
                    eq(clothes.status, 'active'),
                    ne(clothes.userId, buyer.id),
                ))
                .returning();

            if (!item) {
                // Explain why the claim failed; the whole order is rolled back by the throw.
                const existing = await tx.query.clothes.findFirst({ where: eq(clothes.id, itemId) });
                if (!existing) throw new AppError(`Item ${itemId} does not exist.`, 404);
                if (existing.userId === buyer.id) throw new AppError(`You cannot buy your own item '${existing.name}'.`, 400);
                throw new AppError(`'${existing.name}' is no longer available.`, 409);
            }

            // Create notification for seller
            await tx.insert(notifications).values({
                userId: item.userId,
                type: 'sale_notification',
                title: 'Item sold',
                message: `Congratulations! You sold '${item.name}'.`,
                itemId: item.id,
                unread: true,
            });

            // Create rating request for buyer
            await tx.insert(notifications).values({
                userId: buyer.id,
                type: 'rating_request',
                title: 'Rate your purchase',
                message: `How was your experience with '${item.name}'? Leave the seller a rating.`,
                itemId: item.id,
                sellerId: item.userId,
                unread: true,
                status: 'pending',
            });

            // Update seller stats
            const statsUpdate = {
                salesCount: sql`${users.salesCount} + 1`,
            };

            await tx.update(users)
                .set(statsUpdate)
                .where(eq(users.id, item.userId));

            purchasedItemIds.push(itemId);
        }

        return purchasedItemIds;
    });
}

/**
 * relist – Transfer ownership of a bought item back to active.
 */
async function relist(buyerAuthUid, itemId, updates = {}) {
    const buyer = await db.query.users.findFirst({
        where: eq(users.authUid, buyerAuthUid),
    });
    if (!buyer) throw new AppError('User not found.', 404);

    const item = await db.query.clothes.findFirst({
        where: eq(clothes.id, itemId),
    });

    if (!item) throw new AppError('Item not found.', 404);
    if (item.buyerId !== buyer.id) {
        throw new AppError('Only the buyer of this item can relist it.', 403);
    }

    await db.update(clothes)
        .set({
            userId: buyer.id,
            buyerId: null,
            status: 'active',
            updatedAt: new Date(),
            ...updates,
        })
        .where(eq(clothes.id, itemId));
}

module.exports = { processCheckout, relist };
