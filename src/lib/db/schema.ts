import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  varchar,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Enums
export const userRoleEnum = pgEnum("user_role", ["buyer", "seller", "admin"]);
export const productTypeEnum = pgEnum("product_type", ["digital", "physical"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "active"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid", 
  "fulfilled",
  "completed",
  "refunded",
  "disputed"
]);
export const shopStatusEnum = pgEnum("shop_status", ["active", "suspended"]);
export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "processing", 
  "paid",
  "failed"
]);
export const disputeStatusEnum = pgEnum("dispute_status", [
  "pending",
  "under_review",
  "resolved",
  "closed"
]);
export const webhookStatusEnum = pgEnum("webhook_status", [
  "pending",
  "processing",
  "succeeded",
  "failed"
]);

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("buyer"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
}));

// User profiles
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 255 }),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  links: jsonb("links_json").$type<{ url: string; label: string }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shops
export const shops = pgTable("shops", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  handle: varchar("handle", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  bio: text("bio"),
  bannerUrl: text("banner_url"),
  logoUrl: text("logo_url"),
  country: varchar("country", { length: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  policy: jsonb("policy_json").$type<{
    shipping?: string;
    returns?: string;
    privacy?: string;
  }>(),
  status: shopStatusEnum("status").notNull().default("active"),
  stripeAccountId: text("stripe_account_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  handleIdx: uniqueIndex("shops_handle_idx").on(table.handle),
  ownerIdx: index("shops_owner_idx").on(table.ownerId),
}));

// Shop members (for future multi-user shops)
export const shopMembers = pgTable("shop_members", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  shopId: text("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull().default("staff"), // owner, manager, staff
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  shopUserIdx: uniqueIndex("shop_members_shop_user_idx").on(table.shopId, table.userId),
}));

// Categories
export const categories: any = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  parentId: text("parent_id").references((): any => categories.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("categories_slug_idx").on(table.slug),
  parentIdx: index("categories_parent_idx").on(table.parentId),
}));

// Products
export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  shopId: text("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  type: productTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  descriptionMd: text("description_md"),
  priceCents: integer("price_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  categoryId: text("category_id").references(() => categories.id),
  tags: text("tags_text"), // Space-separated tags for FTS
  photos: jsonb("photos_json").$type<{
    id: string;
    url: string;
    alt?: string;
    order: number;
  }[]>(),
  attributes: jsonb("attributes_json").$type<Record<string, any>>(),
  status: productStatusEnum("status").notNull().default("draft"),
  featured: boolean("featured").default(false),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  shopSlugIdx: uniqueIndex("products_shop_slug_idx").on(table.shopId, table.slug),
  statusIdx: index("products_status_idx").on(table.status),
  categoryIdx: index("products_category_idx").on(table.categoryId),
  tagsIdx: index("products_tags_idx").on(table.tags), // For FTS
  featuredIdx: index("products_featured_idx").on(table.featured),
}));

// Product variants (for physical products)
export const variants = pgTable("variants", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 100 }),
  options: jsonb("options_json").$type<Record<string, string>>(), // e.g., { "size": "L", "color": "red" }
  priceCentsOverride: integer("price_cents_override"), // Override product base price
  stockQty: integer("stock_qty"),
  barcode: varchar("barcode", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("variants_product_idx").on(table.productId),
  skuIdx: index("variants_sku_idx").on(table.sku),
}));

// Digital assets
export const digitalAssets = pgTable("digital_assets", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileSha256: varchar("file_sha256", { length: 64 }),
  fileBytes: integer("file_bytes"),
  mimeType: varchar("mime_type", { length: 100 }),
  watermarkType: varchar("watermark_type", { length: 20 }).default("none"), // pdf, image, none
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("digital_assets_product_idx").on(table.productId),
  hashIdx: index("digital_assets_hash_idx").on(table.fileSha256),
}));

// Carts
export const carts = pgTable("carts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 255 }), // For anonymous carts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("carts_user_idx").on(table.userId),
  sessionIdx: index("carts_session_idx").on(table.sessionId),
}));

// Cart items
export const cartItems = pgTable("cart_items", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  cartId: text("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: text("variant_id").references(() => variants.id, { onDelete: "cascade" }),
  qty: integer("qty").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  cartIdx: index("cart_items_cart_idx").on(table.cartId),
  productIdx: index("cart_items_product_idx").on(table.productId),
}));

// Orders
export const orders = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  buyerId: text("buyer_id").references(() => users.id),
  shopId: text("shop_id").notNull().references(() => shops.id),
  totalCents: integer("total_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  taxCents: integer("tax_cents").default(0),
  feesCents: integer("fees_cents").default(0),
  processorFeesCents: integer("processor_fees_cents").default(0),
  shippingCents: integer("shipping_cents").default(0),
  status: orderStatusEnum("status").notNull().default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  shippingAddress: jsonb("shipping_address").$type<{
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }>(),
  billingAddress: jsonb("billing_address").$type<{
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  buyerIdx: index("orders_buyer_idx").on(table.buyerId),
  shopIdx: index("orders_shop_idx").on(table.shopId),
  statusIdx: index("orders_status_idx").on(table.status),
  stripeIdx: index("orders_stripe_idx").on(table.stripePaymentIntentId),
}));

// Order items
export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  variantId: text("variant_id").references(() => variants.id),
  titleSnapshot: varchar("title_snapshot", { length: 255 }).notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  qty: integer("qty").notNull().default(1),
  type: productTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("order_items_order_idx").on(table.orderId),
  productIdx: index("order_items_product_idx").on(table.productId),
}));

// Shipments
export const shipments = pgTable("shipments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  carrier: varchar("carrier", { length: 100 }),
  trackingNo: varchar("tracking_no", { length: 255 }),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("shipments_order_idx").on(table.orderId),
  trackingIdx: index("shipments_tracking_idx").on(table.trackingNo),
}));

// Digital downloads
export const downloads = pgTable("downloads", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  orderItemId: text("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  buyerId: text("buyer_id").references(() => users.id),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  maxAttempts: integer("max_attempts").default(5),
  attempts: integer("attempts").default(0),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastAccessAt: timestamp("last_access_at"),
}, (table) => ({
  tokenIdx: uniqueIndex("downloads_token_idx").on(table.token),
  orderItemIdx: index("downloads_order_item_idx").on(table.orderItemId),
  buyerIdx: index("downloads_buyer_idx").on(table.buyerId),
}));

// Reviews
export const reviews = pgTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  orderItemId: text("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  reviewerId: text("reviewer_id").references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  bodyMd: text("body_md"),
  photos: jsonb("photos_json").$type<{
    id: string;
    url: string;
    alt?: string;
  }[]>(),
  isFlagged: boolean("is_flagged").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orderItemIdx: uniqueIndex("reviews_order_item_idx").on(table.orderItemId),
  reviewerIdx: index("reviews_reviewer_idx").on(table.reviewerId),
  flaggedIdx: index("reviews_flagged_idx").on(table.isFlagged),
}));

// Forum categories
export const forumCategories = pgTable("forum_categories", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("forum_categories_slug_idx").on(table.slug),
}));

// Forum threads
export const forumThreads = pgTable("forum_threads", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  categoryId: text("category_id").notNull().references(() => forumCategories.id),
  authorId: text("author_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  bodyMd: text("body_md"),
  tags: text("tags_text"), // Space-separated for FTS
  pinned: boolean("pinned").default(false),
  locked: boolean("locked").default(false),
  viewCount: integer("view_count").default(0),
  postCount: integer("post_count").default(0),
  lastPostAt: timestamp("last_post_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("forum_threads_category_idx").on(table.categoryId),
  authorIdx: index("forum_threads_author_idx").on(table.authorId),
  tagsIdx: index("forum_threads_tags_idx").on(table.tags),
  pinnedIdx: index("forum_threads_pinned_idx").on(table.pinned),
}));

// Forum posts
export const forumPosts = pgTable("forum_posts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  threadId: text("thread_id").notNull().references(() => forumThreads.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => users.id),
  bodyMd: text("body_md").notNull(),
  isDeleted: boolean("is_deleted").default(false),
  isAcceptedAnswer: boolean("is_accepted_answer").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  threadIdx: index("forum_posts_thread_idx").on(table.threadId),
  authorIdx: index("forum_posts_author_idx").on(table.authorId),
  acceptedIdx: index("forum_posts_accepted_idx").on(table.isAcceptedAnswer),
}));

// Forum votes
export const forumVotes = pgTable("forum_votes", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  postId: text("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  voterId: text("voter_id").references(() => users.id),
  value: integer("value").notNull(), // +1 or -1
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  postVoterIdx: uniqueIndex("forum_votes_post_voter_idx").on(table.postId, table.voterId),
}));

// Favorites/Wishlist
export const favorites = pgTable("favorites", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userProductIdx: uniqueIndex("favorites_user_product_idx").on(table.userId, table.productId),
}));

// Payouts
export const payouts = pgTable("payouts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  sellerId: text("seller_id").notNull().references(() => users.id),
  provider: varchar("provider", { length: 50 }).notNull().default("stripe"),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: payoutStatusEnum("status").notNull().default("pending"),
  stripePayoutId: text("stripe_payout_id"),
  scheduledFor: timestamp("scheduled_for"),
  paidAt: timestamp("paid_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sellerIdx: index("payouts_seller_idx").on(table.sellerId),
  statusIdx: index("payouts_status_idx").on(table.status),
  stripeIdx: index("payouts_stripe_idx").on(table.stripePayoutId),
}));

// Disputes
export const disputes = pgTable("disputes", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  orderId: text("order_id").notNull().references(() => orders.id),
  type: varchar("type", { length: 50 }).notNull(), // chargeback, inquiry
  status: disputeStatusEnum("status").notNull().default("pending"),
  reason: text("reason"),
  evidenceUrl: text("evidence_url"),
  stripeDisputeId: text("stripe_dispute_id"),
  amount: integer("amount_cents"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("disputes_order_idx").on(table.orderId),
  statusIdx: index("disputes_status_idx").on(table.status),
  stripeIdx: index("disputes_stripe_idx").on(table.stripeDisputeId),
}));

// Webhooks
export const webhooks = pgTable("webhooks", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  provider: varchar("provider", { length: 50 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload_json").notNull(),
  status: webhookStatusEnum("status").notNull().default("pending"),
  attempts: integer("attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  processedAt: timestamp("processed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  providerEventIdx: index("webhooks_provider_event_idx").on(table.provider, table.eventType),
  statusIdx: index("webhooks_status_idx").on(table.status),
}));

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  actorId: text("actor_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  subjectTable: varchar("subject_table", { length: 100 }).notNull(),
  subjectId: text("subject_id").notNull(),
  before: jsonb("before_json"),
  after: jsonb("after_json"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  actorIdx: index("audit_logs_actor_idx").on(table.actorId),
  subjectIdx: index("audit_logs_subject_idx").on(table.subjectTable, table.subjectId),
}));

// Feature flags
export const featureFlags = pgTable("feature_flags", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value_json").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  shops: many(shops),
  orders: many(orders),
  reviews: many(reviews),
  forumThreads: many(forumThreads),
  forumPosts: many(forumPosts),
  favorites: many(favorites),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  owner: one(users, {
    fields: [shops.ownerId],
    references: [users.id],
  }),
  products: many(products),
  orders: many(orders),
  members: many(shopMembers),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  shop: one(shops, {
    fields: [products.shopId],
    references: [shops.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(variants),
  digitalAssets: many(digitalAssets),
  orderItems: many(orderItems),
  favorites: many(favorites),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
  }),
  shop: one(shops, {
    fields: [orders.shopId],
    references: [shops.id],
  }),
  items: many(orderItems),
  shipments: many(shipments),
  disputes: many(disputes),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(variants, {
    fields: [orderItems.variantId],
    references: [variants.id],
  }),
  reviews: many(reviews),
  downloads: many(downloads),
}));

export const forumThreadsRelations = relations(forumThreads, ({ one, many }) => ({
  category: one(forumCategories, {
    fields: [forumThreads.categoryId],
    references: [forumCategories.id],
  }),
  author: one(users, {
    fields: [forumThreads.authorId],
    references: [users.id],
  }),
  posts: many(forumPosts),
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  thread: one(forumThreads, {
    fields: [forumPosts.threadId],
    references: [forumThreads.id],
  }),
  author: one(users, {
    fields: [forumPosts.authorId],
    references: [users.id],
  }),
  votes: many(forumVotes),
}));