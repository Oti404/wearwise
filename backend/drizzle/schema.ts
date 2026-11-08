import { pgTable, text, timestamp, uuid, doublePrecision, integer, boolean, vector, unique, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. USERS (auth_uid mirrors id; kept for compatibility with existing services)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUid: text("auth_uid").unique().notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").unique().notNull(),
  phone: text("phone"),
  city: text("city"),
  avatarUrl: text("avatar_url"),
  salesCount: integer("sales_count").default(0),
  donationsCount: integer("donations_count").default(0),
  tradesCount: integer("trades_count").default(0),
  reviewCount: integer("review_count").default(0),
  rating: doublePrecision("rating").default(0),
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 1b. USER CREDENTIALS (kept out of `users` so profile queries can never leak the hash)
export const userCredentials = pgTable("user_credentials", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. CLOTHES
export const clothes = pgTable("clothes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(),
  size: text("size").notNull(),
  condition: text("condition").notNull(),
  mode: text("mode").notNull(),
  status: text("status").default('active').notNull(),
  buyerId: uuid("buyer_id").references(() => users.id, { onDelete: 'set null' }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. CLOTHING IMAGES (1:N with clothes)
export const clothingImages = pgTable("clothing_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  clothingId: uuid("clothing_id").references(() => clothes.id, { onDelete: 'cascade' }).notNull(),
  url: text("url").notNull(),
  isPrimary: boolean("is_primary").default(false),
  aiEmbedding: vector("ai_embedding", { dimensions: 512 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. NOTIFICATIONS
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  itemId: uuid("item_id").references(() => clothes.id, { onDelete: 'set null' }),
  sellerId: uuid("seller_id").references(() => users.id, { onDelete: 'set null' }),
  unread: boolean("unread").default(true),
  status: text("status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. RATINGS
export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  raterId: uuid("rater_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  itemId: uuid("item_id").references(() => clothes.id, { onDelete: 'set null' }),
  rating: doublePrecision("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 6. FOLLOWS (Many-to-Many user relationships)
export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: uuid("follower_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followedId: uuid("followed_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  unique("unique_follow").on(t.followerId, t.followedId),
  index("idx_follows_follower").on(t.followerId),
  index("idx_follows_followed").on(t.followedId),
]);

// RELATIONS
export const clothesRelations = relations(clothes, ({ one, many }) => ({
  user: one(users, {
    fields: [clothes.userId],
    references: [users.id],
  }),
  images: many(clothingImages),
}));

export const imagesRelations = relations(clothingImages, ({ one }) => ({
  clothing: one(clothes, {
    fields: [clothingImages.clothingId],
    references: [clothes.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
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

export const usersRelations = relations(users, ({ many }) => ({
  clothes: many(clothes),
  followers: many(follows, { relationName: 'followers' }),
  following: many(follows, { relationName: 'following' }),
}));
