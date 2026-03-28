# Supabase Database Setup — Multi-Store SaaS Platform

Run these SQL commands in your **Supabase SQL Editor** (Dashboard → SQL Editor).

## Drop All Existing Tables (Run First)

Run this **once** to delete all old data and tables before creating the new schema:

```sql
-- Drop all policies first (avoids dependency errors)
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public')
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
  END LOOP;
END $$;

-- Drop all tables in correct order (child tables first)
DROP TABLE IF EXISTS ad_impressions CASCADE;
DROP TABLE IF EXISTS user_behavior_tags CASCADE;
DROP TABLE IF EXISTS cross_promotions CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_store_memberships CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

## Create Tables

```sql
-- Users (shared across all stores)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  birth_date DATE,
  city TEXT,
  gender TEXT DEFAULT 'unknown' CHECK (gender IN ('male','female','unknown')),
  joined_platform TIMESTAMPTZ DEFAULT now(),
  last_active TIMESTAMPTZ DEFAULT now()
);

-- Stores
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  category TEXT,
  city TEXT,
  primary_color TEXT DEFAULT '#D4AF37',
  bot_token TEXT UNIQUE NOT NULL,
  bot_username TEXT UNIQUE NOT NULL,
  mini_app_url TEXT,
  points_rate INTEGER DEFAULT 1,
  tier_config JSONB DEFAULT '{
    "bronze":   {"min": 0,     "max": 999},
    "silver":   {"min": 1000,  "max": 4999},
    "gold":     {"min": 5000,  "max": 9999},
    "platinum": {"min": 10000, "max": 999999}
  }',
  welcome_points INTEGER DEFAULT 100,
  plan TEXT DEFAULT 'basic' CHECK (plan IN ('basic','pro','enterprise')),
  owner_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User-Store Memberships (the core linking table)
CREATE TABLE IF NOT EXISTS user_store_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  total_spent NUMERIC(12,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_purchase TIMESTAMPTZ,
  referral_code TEXT UNIQUE DEFAULT 'ref-' || substr(md5(random()::text), 1, 6),
  UNIQUE (user_id, store_id)
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  store_id UUID REFERENCES stores(id),
  membership_id UUID REFERENCES user_store_memberships(id),
  type TEXT CHECK (type IN ('earn','redeem','bonus','referral','ad_reward','welcome')),
  points INTEGER NOT NULL,
  amount NUMERIC(10,2),
  qr_token TEXT UNIQUE,
  qr_used BOOLEAN DEFAULT FALSE,
  qr_expires_at TIMESTAMPTZ,
  offer_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Offers
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('discount','gift','double_points','flash','exclusive')),
  discount_percent INTEGER,
  points_cost INTEGER NOT NULL,
  min_tier TEXT DEFAULT 'bronze',
  occasion_type TEXT CHECK (occasion_type IN ('always','fixed','birthday','anniversary','win_back','flash')),
  occasion_date DATE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  image_url TEXT,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  store_id UUID REFERENCES stores(id),
  offer_id UUID REFERENCES offers(id),
  coupon_code TEXT UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 10)),
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT now() + interval '24 hours'
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_exclusive BOOLEAN DEFAULT FALSE,
  min_tier_to_view TEXT DEFAULT 'bronze',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  referrer_id UUID REFERENCES users(id),
  referred_id UUID REFERENCES users(id),
  referrer_points INTEGER DEFAULT 200,
  referred_points INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (store_id, referred_id)
);

-- Cross Promotions (ads between stores)
CREATE TABLE IF NOT EXISTS cross_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_store_id UUID REFERENCES stores(id),
  to_store_id UUID REFERENCES stores(id),
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  cta_label TEXT DEFAULT 'اكتشف المتجر',
  cta_url TEXT,
  target_tiers TEXT[] DEFAULT ARRAY['bronze','silver','gold','platinum'],
  target_gender TEXT,
  target_city TEXT,
  target_min_spent NUMERIC(10,2),
  reward_points INTEGER DEFAULT 50,
  budget_points INTEGER,
  spent_points INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Impressions (tracking)
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID REFERENCES cross_promotions(id),
  user_id UUID REFERENCES users(id),
  shown_at TIMESTAMPTZ DEFAULT now(),
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  points_rewarded INTEGER DEFAULT 0
);

-- User Behavior Tags
CREATE TABLE IF NOT EXISTS user_behavior_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  tag TEXT NOT NULL,
  score INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, tag)
);
```

## Seed Demo Store + Data

```sql
-- Create a demo store
INSERT INTO stores (slug, name, bot_token, bot_username, primary_color, welcome_points, is_active)
VALUES ('demo-store', 'Demo Store', 'DEMO_BOT_TOKEN', 'demo_store_bot', '#10b981', 100, true)
ON CONFLICT (slug) DO NOTHING;
```

## Row Level Security

Run this **once** to enable RLS and allow anonymous access:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_store_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow anon select users" ON users;
DROP POLICY IF EXISTS "Allow anon select stores" ON stores;
DROP POLICY IF EXISTS "Allow anon select memberships" ON user_store_memberships;
DROP POLICY IF EXISTS "Allow anon select transactions" ON transactions;
DROP POLICY IF EXISTS "Allow anon select offers" ON offers;
DROP POLICY IF EXISTS "Allow anon select products" ON products;
DROP POLICY IF EXISTS "Allow anon select redemptions" ON redemptions;
DROP POLICY IF EXISTS "Allow anon insert users" ON users;
DROP POLICY IF EXISTS "Allow anon insert memberships" ON user_store_memberships;
DROP POLICY IF EXISTS "Allow anon insert transactions" ON transactions;
DROP POLICY IF EXISTS "Allow anon insert redemptions" ON redemptions;
DROP POLICY IF EXISTS "Allow anon update users" ON users;
DROP POLICY IF EXISTS "Allow anon update memberships" ON user_store_memberships;

-- Allow anonymous reads (required for the app to load data)
CREATE POLICY "Allow anon select users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow anon select stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Allow anon select memberships" ON user_store_memberships FOR SELECT USING (true);
CREATE POLICY "Allow anon select transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow anon select offers" ON offers FOR SELECT USING (true);
CREATE POLICY "Allow anon select products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow anon select redemptions" ON redemptions FOR SELECT USING (true);

-- Allow anonymous inserts
CREATE POLICY "Allow anon insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert stores" ON stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert offers" ON offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert memberships" ON user_store_memberships FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert redemptions" ON redemptions FOR INSERT WITH CHECK (true);

-- Allow anonymous updates
CREATE POLICY "Allow anon update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow anon update stores" ON stores FOR UPDATE USING (true);
CREATE POLICY "Allow anon update memberships" ON user_store_memberships FOR UPDATE USING (true);
```
