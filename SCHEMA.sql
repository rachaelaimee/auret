-- Auret Marketplace Database Schema
-- PostgreSQL DDL with Row Level Security (RLS)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enums
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE product_type AS ENUM ('digital', 'physical');
CREATE TYPE product_status AS ENUM ('draft', 'active');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'fulfilled', 'completed', 'refunded', 'disputed');
CREATE TYPE shop_status AS ENUM ('active', 'suspended');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'paid', 'failed');
CREATE TYPE dispute_status AS ENUM ('pending', 'under_review', 'resolved', 'closed');
CREATE TYPE webhook_status AS ENUM ('pending', 'processing', 'succeeded', 'failed');

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT concat('usr_', gen_random_uuid()::text),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'buyer',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Admins can read all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'admin')
);

-- User profiles
CREATE TABLE profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    links_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (true);

-- Shops
CREATE TABLE shops (
    id TEXT PRIMARY KEY DEFAULT concat('shop_', gen_random_uuid()::text),
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    handle VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    banner_url TEXT,
    logo_url TEXT,
    country VARCHAR(2),
    currency VARCHAR(3) DEFAULT 'USD',
    policy_json JSONB,
    status shop_status NOT NULL DEFAULT 'active',
    stripe_account_id TEXT,
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX shops_handle_idx ON shops(handle);
CREATE INDEX shops_owner_idx ON shops(owner_id);
CREATE INDEX shops_status_idx ON shops(status);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage their shops" ON shops FOR ALL USING (auth.uid()::text = owner_id);
CREATE POLICY "Active shops are publicly readable" ON shops FOR SELECT USING (status = 'active');

-- Categories
CREATE TABLE categories (
    id TEXT PRIMARY KEY DEFAULT concat('cat_', gen_random_uuid()::text),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id TEXT REFERENCES categories(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX categories_slug_idx ON categories(slug);
CREATE INDEX categories_parent_idx ON categories(parent_id);

-- Products
CREATE TABLE products (
    id TEXT PRIMARY KEY DEFAULT concat('prod_', gen_random_uuid()::text),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    type product_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description_md TEXT,
    price_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    category_id TEXT REFERENCES categories(id),
    tags_text TEXT, -- Space-separated tags for FTS
    photos_json JSONB,
    attributes_json JSONB,
    status product_status NOT NULL DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX products_shop_slug_idx ON products(shop_id, slug);
CREATE INDEX products_status_idx ON products(status);
CREATE INDEX products_category_idx ON products(category_id);
CREATE INDEX products_tags_gin_idx ON products USING gin(to_tsvector('english', tags_text));
CREATE INDEX products_title_gin_idx ON products USING gin(to_tsvector('english', title));
CREATE INDEX products_featured_idx ON products(featured) WHERE featured = true;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage their products" ON products FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.owner_id = auth.uid()::text)
);
CREATE POLICY "Active products are publicly readable" ON products FOR SELECT USING (status = 'active');

-- Product variants
CREATE TABLE variants (
    id TEXT PRIMARY KEY DEFAULT concat('var_', gen_random_uuid()::text),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    options_json JSONB,
    price_cents_override INTEGER,
    stock_qty INTEGER,
    barcode VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX variants_product_idx ON variants(product_id);
CREATE INDEX variants_sku_idx ON variants(sku) WHERE sku IS NOT NULL;

ALTER TABLE variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants inherit product permissions" ON variants FOR ALL USING (
    EXISTS (
        SELECT 1 FROM products 
        JOIN shops ON products.shop_id = shops.id 
        WHERE products.id = variants.product_id 
        AND (shops.owner_id = auth.uid()::text OR products.status = 'active')
    )
);

-- Digital assets
CREATE TABLE digital_assets (
    id TEXT PRIMARY KEY DEFAULT concat('asset_', gen_random_uuid()::text),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_sha256 VARCHAR(64),
    file_bytes INTEGER,
    mime_type VARCHAR(100),
    watermark_type VARCHAR(20) DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX digital_assets_product_idx ON digital_assets(product_id);
CREATE INDEX digital_assets_hash_idx ON digital_assets(file_sha256);

ALTER TABLE digital_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Digital assets inherit product permissions" ON digital_assets FOR ALL USING (
    EXISTS (
        SELECT 1 FROM products 
        JOIN shops ON products.shop_id = shops.id 
        WHERE products.id = digital_assets.product_id 
        AND shops.owner_id = auth.uid()::text
    )
);

-- Orders
CREATE TABLE orders (
    id TEXT PRIMARY KEY DEFAULT concat('ord_', gen_random_uuid()::text),
    buyer_id TEXT REFERENCES users(id),
    shop_id TEXT NOT NULL REFERENCES shops(id),
    total_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    tax_cents INTEGER DEFAULT 0,
    fees_cents INTEGER DEFAULT 0,
    processor_fees_cents INTEGER DEFAULT 0,
    shipping_cents INTEGER DEFAULT 0,
    status order_status NOT NULL DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX orders_buyer_idx ON orders(buyer_id);
CREATE INDEX orders_shop_idx ON orders(shop_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_stripe_idx ON orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid()::text = buyer_id);
CREATE POLICY "Shop owners can view their orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()::text)
);
CREATE POLICY "Shop owners can update their orders" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()::text)
);

-- Order items
CREATE TABLE order_items (
    id TEXT PRIMARY KEY DEFAULT concat('item_', gen_random_uuid()::text),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    variant_id TEXT REFERENCES variants(id),
    title_snapshot VARCHAR(255) NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    type product_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX order_items_order_idx ON order_items(order_id);
CREATE INDEX order_items_product_idx ON order_items(product_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items inherit order permissions" ON order_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND (orders.buyer_id = auth.uid()::text OR 
             EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()::text))
    )
);

-- Reviews
CREATE TABLE reviews (
    id TEXT PRIMARY KEY DEFAULT concat('rev_', gen_random_uuid()::text),
    order_item_id TEXT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    reviewer_id TEXT REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    body_md TEXT,
    photos_json JSONB,
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX reviews_order_item_idx ON reviews(order_item_id);
CREATE INDEX reviews_reviewer_idx ON reviews(reviewer_id);
CREATE INDEX reviews_flagged_idx ON reviews(is_flagged) WHERE is_flagged = true;

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable" ON reviews FOR SELECT USING (NOT is_flagged);
CREATE POLICY "Users can create reviews for their orders" ON reviews FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM order_items 
        JOIN orders ON order_items.order_id = orders.id 
        WHERE order_items.id = order_item_id 
        AND orders.buyer_id = auth.uid()::text 
        AND orders.status = 'completed'
    )
);

-- Forum categories
CREATE TABLE forum_categories (
    id TEXT PRIMARY KEY DEFAULT concat('fcat_', gen_random_uuid()::text),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX forum_categories_slug_idx ON forum_categories(slug);

-- Forum threads
CREATE TABLE forum_threads (
    id TEXT PRIMARY KEY DEFAULT concat('thread_', gen_random_uuid()::text),
    category_id TEXT NOT NULL REFERENCES forum_categories(id),
    author_id TEXT REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    body_md TEXT,
    tags_text TEXT,
    pinned BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    last_post_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX forum_threads_category_idx ON forum_threads(category_id);
CREATE INDEX forum_threads_author_idx ON forum_threads(author_id);
CREATE INDEX forum_threads_tags_gin_idx ON forum_threads USING gin(to_tsvector('english', tags_text));
CREATE INDEX forum_threads_pinned_idx ON forum_threads(pinned) WHERE pinned = true;

-- Forum posts
CREATE TABLE forum_posts (
    id TEXT PRIMARY KEY DEFAULT concat('post_', gen_random_uuid()::text),
    thread_id TEXT NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id TEXT REFERENCES users(id),
    body_md TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_accepted_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX forum_posts_thread_idx ON forum_posts(thread_id);
CREATE INDEX forum_posts_author_idx ON forum_posts(author_id);
CREATE INDEX forum_posts_accepted_idx ON forum_posts(is_accepted_answer) WHERE is_accepted_answer = true;

-- Forum votes
CREATE TABLE forum_votes (
    id TEXT PRIMARY KEY DEFAULT concat('vote_', gen_random_uuid()::text),
    post_id TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    voter_id TEXT REFERENCES users(id),
    value INTEGER NOT NULL CHECK (value IN (-1, 1)),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX forum_votes_post_voter_idx ON forum_votes(post_id, voter_id);

-- Digital downloads
CREATE TABLE downloads (
    id TEXT PRIMARY KEY DEFAULT concat('dl_', gen_random_uuid()::text),
    order_item_id TEXT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    buyer_id TEXT REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    max_attempts INTEGER DEFAULT 5,
    attempts INTEGER DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_access_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX downloads_token_idx ON downloads(token);
CREATE INDEX downloads_order_item_idx ON downloads(order_item_id);
CREATE INDEX downloads_buyer_idx ON downloads(buyer_id);

ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own downloads" ON downloads FOR SELECT USING (auth.uid()::text = buyer_id);

-- Audit logs
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT concat('audit_', gen_random_uuid()::text),
    actor_id TEXT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    subject_table VARCHAR(100) NOT NULL,
    subject_id TEXT NOT NULL,
    before_json JSONB,
    after_json JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX audit_logs_actor_idx ON audit_logs(actor_id);
CREATE INDEX audit_logs_subject_idx ON audit_logs(subject_table, subject_id);
CREATE INDEX audit_logs_action_idx ON audit_logs(action);

-- Feature flags
CREATE TABLE feature_flags (
    key VARCHAR(100) PRIMARY KEY,
    value_json JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Webhooks
CREATE TABLE webhooks (
    id TEXT PRIMARY KEY DEFAULT concat('wh_', gen_random_uuid()::text),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_json JSONB NOT NULL,
    status webhook_status NOT NULL DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX webhooks_provider_event_idx ON webhooks(provider, event_type);
CREATE INDEX webhooks_status_idx ON webhooks(status);

-- Triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON forum_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();