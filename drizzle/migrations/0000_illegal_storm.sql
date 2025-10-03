DO $$ BEGIN
 CREATE TYPE "craft_room_status" AS ENUM('active', 'paused', 'ended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "dispute_status" AS ENUM('pending', 'under_review', 'resolved', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "order_status" AS ENUM('pending', 'paid', 'fulfilled', 'completed', 'refunded', 'disputed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "participant_role" AS ENUM('host', 'moderator', 'participant');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "payout_status" AS ENUM('pending', 'processing', 'paid', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "product_status" AS ENUM('draft', 'active');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "product_type" AS ENUM('digital', 'physical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "shop_status" AS ENUM('active', 'suspended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('buyer', 'seller', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "webhook_status" AS ENUM('pending', 'processing', 'succeeded', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" varchar(100) NOT NULL,
	"subject_table" varchar(100) NOT NULL,
	"subject_id" text NOT NULL,
	"before_json" jsonb,
	"after_json" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cart_items" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"qty" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "carts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"parent_id" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "craft_room_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"message_type" varchar(20) DEFAULT 'text',
	"metadata" jsonb,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "craft_room_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "participant_role" DEFAULT 'participant' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"is_video_enabled" boolean DEFAULT true,
	"is_audio_enabled" boolean DEFAULT true,
	"is_banned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "craft_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"host_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"tags_text" text,
	"max_participants" integer DEFAULT 8,
	"is_public" boolean DEFAULT true,
	"requires_approval" boolean DEFAULT false,
	"status" "craft_room_status" DEFAULT 'active' NOT NULL,
	"daily_room_name" varchar(255),
	"daily_room_url" text,
	"scheduled_start_at" timestamp,
	"actual_started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "digital_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"storage_path" text NOT NULL,
	"filename" varchar(255) NOT NULL,
	"file_sha256" varchar(64),
	"file_bytes" integer,
	"mime_type" varchar(100),
	"watermark_type" varchar(20) DEFAULT 'none',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disputes" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" "dispute_status" DEFAULT 'pending' NOT NULL,
	"reason" text,
	"evidence_url" text,
	"stripe_dispute_id" text,
	"amount_cents" integer,
	"currency" varchar(3) DEFAULT 'USD',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "downloads" (
	"id" text PRIMARY KEY NOT NULL,
	"order_item_id" text NOT NULL,
	"buyer_id" text,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"max_attempts" integer DEFAULT 5,
	"attempts" integer DEFAULT 0,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_access_at" timestamp,
	CONSTRAINT "downloads_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flags" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value_json" jsonb NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forum_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forum_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forum_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"author_id" text,
	"body_md" text NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"is_accepted_answer" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forum_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"author_id" text,
	"title" varchar(255) NOT NULL,
	"body_md" text,
	"tags_text" text,
	"pinned" boolean DEFAULT false,
	"locked" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"post_count" integer DEFAULT 0,
	"last_post_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forum_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"voter_id" text,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"title_snapshot" varchar(255) NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"type" "product_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"buyer_id" text,
	"shop_id" text NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"tax_cents" integer DEFAULT 0,
	"fees_cents" integer DEFAULT 0,
	"processor_fees_cents" integer DEFAULT 0,
	"shipping_cents" integer DEFAULT 0,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" text,
	"shipping_address" jsonb,
	"billing_address" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"seller_id" text NOT NULL,
	"provider" varchar(50) DEFAULT 'stripe' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"stripe_payout_id" text,
	"scheduled_for" timestamp,
	"paid_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"type" "product_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description_md" text,
	"price_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"category_id" text,
	"tags_text" text,
	"photos_json" jsonb,
	"attributes_json" jsonb,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false,
	"views" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" varchar(255),
	"bio" text,
	"location" varchar(255),
	"links_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"order_item_id" text NOT NULL,
	"reviewer_id" text,
	"rating" integer NOT NULL,
	"body_md" text,
	"photos_json" jsonb,
	"is_flagged" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shipments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"carrier" varchar(100),
	"tracking_no" varchar(255),
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shop_members" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(20) DEFAULT 'staff' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shops" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"handle" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"bio" text,
	"banner_url" text,
	"logo_url" text,
	"country" varchar(2),
	"currency" varchar(3) DEFAULT 'USD',
	"policy_json" jsonb,
	"status" "shop_status" DEFAULT 'active' NOT NULL,
	"stripe_account_id" text,
	"stripe_onboarding_complete" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shops_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"avatar_url" text,
	"role" "user_role" DEFAULT 'buyer' NOT NULL,
	"email_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"sku" varchar(100),
	"options_json" jsonb,
	"price_cents_override" integer,
	"stock_qty" integer,
	"barcode" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload_json" jsonb NOT NULL,
	"status" "webhook_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0,
	"last_attempt_at" timestamp,
	"processed_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx" ON "audit_logs" ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_subject_idx" ON "audit_logs" ("subject_table","subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_items_cart_idx" ON "cart_items" ("cart_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_items_product_idx" ON "cart_items" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carts_user_idx" ON "carts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "carts_session_idx" ON "carts" ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_parent_idx" ON "categories" ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "craft_room_messages_room_idx" ON "craft_room_messages" ("room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "craft_room_messages_sender_idx" ON "craft_room_messages" ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "craft_room_messages_type_idx" ON "craft_room_messages" ("message_type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "craft_room_participants_room_user_idx" ON "craft_room_participants" ("room_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "craft_room_participants_room_idx" ON "craft_room_participants" ("room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "craft_room_participants_user_idx" ON "craft_room_participants" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "craft_rooms_host_idx" ON "craft_rooms" ("host_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "craft_rooms_status_idx" ON "craft_rooms" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "craft_rooms_public_idx" ON "craft_rooms" ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "craft_rooms_tags_idx" ON "craft_rooms" ("tags_text");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "craft_rooms_daily_room_idx" ON "craft_rooms" ("daily_room_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "digital_assets_product_idx" ON "digital_assets" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "digital_assets_hash_idx" ON "digital_assets" ("file_sha256");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "disputes_order_idx" ON "disputes" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "disputes_stripe_idx" ON "disputes" ("stripe_dispute_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "downloads_token_idx" ON "downloads" ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "downloads_order_item_idx" ON "downloads" ("order_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "downloads_buyer_idx" ON "downloads" ("buyer_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_product_idx" ON "favorites" ("user_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "forum_categories_slug_idx" ON "forum_categories" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forum_posts_thread_idx" ON "forum_posts" ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forum_posts_author_idx" ON "forum_posts" ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forum_posts_accepted_idx" ON "forum_posts" ("is_accepted_answer");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forum_threads_category_idx" ON "forum_threads" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forum_threads_author_idx" ON "forum_threads" ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forum_threads_tags_idx" ON "forum_threads" ("tags_text");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forum_threads_pinned_idx" ON "forum_threads" ("pinned");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "forum_votes_post_voter_idx" ON "forum_votes" ("post_id","voter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_product_idx" ON "order_items" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_buyer_idx" ON "orders" ("buyer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_shop_idx" ON "orders" ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_stripe_idx" ON "orders" ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payouts_seller_idx" ON "payouts" ("seller_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payouts_stripe_idx" ON "payouts" ("stripe_payout_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_shop_slug_idx" ON "products" ("shop_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_tags_idx" ON "products" ("tags_text");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_featured_idx" ON "products" ("featured");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_order_item_idx" ON "reviews" ("order_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_reviewer_idx" ON "reviews" ("reviewer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_flagged_idx" ON "reviews" ("is_flagged");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipments_order_idx" ON "shipments" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipments_tracking_idx" ON "shipments" ("tracking_no");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "shop_members_shop_user_idx" ON "shop_members" ("shop_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "shops_handle_idx" ON "shops" ("handle");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shops_owner_idx" ON "shops" ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variants_product_idx" ON "variants" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variants_sku_idx" ON "variants" ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhooks_provider_event_idx" ON "webhooks" ("provider","event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhooks_status_idx" ON "webhooks" ("status");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "craft_room_messages" ADD CONSTRAINT "craft_room_messages_room_id_craft_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "craft_rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "craft_room_messages" ADD CONSTRAINT "craft_room_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "craft_room_participants" ADD CONSTRAINT "craft_room_participants_room_id_craft_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "craft_rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "craft_room_participants" ADD CONSTRAINT "craft_room_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "craft_rooms" ADD CONSTRAINT "craft_rooms_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "digital_assets" ADD CONSTRAINT "digital_assets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "downloads" ADD CONSTRAINT "downloads_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "downloads" ADD CONSTRAINT "downloads_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_thread_id_forum_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "forum_threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "forum_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "forum_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payouts" ADD CONSTRAINT "payouts_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shop_members" ADD CONSTRAINT "shop_members_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shop_members" ADD CONSTRAINT "shop_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
