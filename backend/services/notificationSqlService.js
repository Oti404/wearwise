'use strict';

const { db } = require('../drizzle/db');
const { notifications, users } = require('../drizzle/schema');
const { eq, desc, lt, and } = require('drizzle-orm');
const AppError = require('../middlewares/AppError');

const DEFAULT_PAGE_SIZE = 10;

/**
 * Get paginated notifications for a user using cursor-based pagination.
 * authUid comes from the verified token, never from user input.
 */
async function getNotificationsPage(authUid, { cursor, limit = DEFAULT_PAGE_SIZE } = {}) {
  const pageSize = Math.min(parseInt(limit, 10) || DEFAULT_PAGE_SIZE, 50);

  try {
    const targetUser = await db.query.users.findFirst({
        where: eq(users.authUid, authUid)
    });
    if (!targetUser) return { items: [], nextCursor: null };
    const targetUserId = targetUser.id;

    const results = await db.query.notifications.findMany({
      where: (table, { eq, and, lt }) => {
        const conditions = [eq(table.userId, targetUserId)];
        if (cursor) conditions.push(lt(table.createdAt, new Date(cursor)));
        return and(...conditions);
      },
      orderBy: [desc(notifications.createdAt)],
      limit: pageSize + 1,
    });

    const hasMore = results.length > pageSize;
    const items = results.slice(0, pageSize);
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return { items, nextCursor };
  } catch (error) {
    console.error('[SQL] ❌ getNotificationsPage error:', error.message);
    throw error;
  }
}

/**
 * Create a notification (helper).
 * tx is the Drizzle transaction object.
 */
async function createNotification(tx, data) {
  const [newNotif] = await tx.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    itemId: data.itemId || null,
    sellerId: data.sellerId || null,
    unread: true,
    status: data.status || 'active',
  }).returning();
  
  return newNotif;
}

module.exports = { getNotificationsPage, createNotification };
