'use strict';

/**
 * Drizzle ORM Schema (CommonJS version)
 * Mirrors drizzle/schema.ts for use with Node.js require().
 * schema.ts is the source of truth for migrations (drizzle-kit); keep both in sync.
 * ai_embedding is intentionally omitted here so queries don't return 512-float vectors.
 */

const { pgTable, text, timestamp, uuid, doublePrecision, integer, boolean, unique, index } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// 1. USERS
const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    authUid: text('auth_uid').unique().notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    email: text('email').unique().notNull(),
    phone: text('phone'),
    city: text('city'),
    avatarUrl: text('avatar_url'),
    salesCount: integer('sales_count').default(0),
    donationsCount: integer('donations_count').default(0),
    tradesCount: integer('trades_count').default(0),
    reviewCount: integer('review_count').default(0),
    rating: doublePrecision('rating').default(0),
    followersCount: integer('followers_count').default(0),
    followingCount: integer('following_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// 1b. USER CREDENTIALS (kept out of `users` so profile queries can never leak the hash)
const userCredentials = pgTable('user_credentials', {
    userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. CLOTHES
const clothes = pgTable('clothes', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
    price: doublePrecision('price').notNull(),
    category: text('category').notNull(),
    size: text('size').notNull(),
    condition: text('condition').notNull(),
    mode: text('mode').notNull(),
    status: text('status').default('active').notNull(),
    buyerId: uuid('buyer_id').references(() => users.id, { onDelete: 'set null' }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. CLOTHING IMAGES
const clothingImages = pgTable('clothing_images', {
    id: uuid('id').primaryKey().defaultRandom(),
    clothingId: uuid('clothing_id').references(() => clothes.id, { onDelete: 'cascade' }).notNull(),
    url: text('url').notNull(),
    isPrimary: boolean('is_primary').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

// 4. NOTIFICATIONS
const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    itemId: uuid('item_id').references(() => clothes.id, { onDelete: 'set null' }),
    sellerId: uuid('seller_id').references(() => users.id, { onDelete: 'set null' }),
    unread: boolean('unread').default(true),
    status: text('status').default('active'),
    createdAt: timestamp('created_at').defaultNow(),
});

// 5. RATINGS
const ratings = pgTable('ratings', {
    id: uuid('id').primaryKey().defaultRandom(),
    raterId: uuid('rater_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    itemId: uuid('item_id').references(() => clothes.id, { onDelete: 'set null' }),
    rating: doublePrecision('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow(),
});

// 6. FOLLOWS
const follows = pgTable('follows', {
    id: uuid('id').primaryKey().defaultRandom(),
    followerId: uuid('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    followedId: uuid('followed_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
    unique('unique_follow').on(t.followerId, t.followedId),
    index('idx_follows_follower').on(t.followerId),
    index('idx_follows_followed').on(t.followedId),
]);

// RELATIONS
const clothesRelations = relations(clothes, ({ one, many }) => ({
    user: one(users, {
        fields: [clothes.userId],
        references: [users.id],
    }),
    images: many(clothingImages),
}));

const imagesRelations = relations(clothingImages, ({ one }) => ({
    clothing: one(clothes, {
        fields: [clothingImages.clothingId],
        references: [clothes.id],
    }),
}));

const followsRelations = relations(follows, ({ one }) => ({
    follower: one(users, {
        fields: [follows.followerId],
        references: [users.id],
        relationName: 'following',
    }),
    followed: one(users, {
        fields: [follows.followedId],
        references: [users.id],
        relationName: 'followers',
    }),
}));

const usersRelations = relations(users, ({ many }) => ({
    clothes: many(clothes),
    followers: many(follows, { relationName: 'followers' }),
    following: many(follows, { relationName: 'following' }),
}));

module.exports = {
    users, userCredentials, clothes, clothingImages, notifications, ratings, follows,
    clothesRelations, imagesRelations, followsRelations, usersRelations,
};
