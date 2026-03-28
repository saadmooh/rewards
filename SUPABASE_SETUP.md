# Supabase Database Setup

Run these SQL commands in your **Supabase SQL Editor** (Dashboard → SQL Editor).

## Create Tables

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  birth_date DATE,
  points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  join_date TIMESTAMPTZ DEFAULT now(),
  last_purchase TIMESTAMPTZ,
  referral_code TEXT UNIQUE DEFAULT substr(md5(random()::text),1,8)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT CHECK (type IN ('earn','redeem')),
  points INTEGER NOT NULL,
  amount NUMERIC(10,2),
  qr_token TEXT UNIQUE,
  qr_used BOOLEAN DEFAULT FALSE,
  qr_expires_at TIMESTAMPTZ,
  offer_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  discount_percent INTEGER,
  points_cost INTEGER NOT NULL,
  min_tier TEXT DEFAULT 'bronze',
  occasion_type TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  offer_id UUID,
  coupon_code TEXT UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text),1,10)),
  used_at TIMESTAMPTZ DEFAULT now(),
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ DEFAULT now() + interval '24 hours'
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
```

## Seed Demo Data

```sql
INSERT INTO offers (title, description, type, discount_percent, points_cost, min_tier, occasion_type, is_active) VALUES
('30% Off Shirts', 'Valid on all shirts and blouses', 'discount', 30, 500, 'bronze', 'always', true),
('Double Points', 'Earn 2x points this weekend', 'double_points', 0, 0, 'bronze', 'flash', true),
('Free Gift', 'Free accessory with purchase over 5000 DZD', 'gift', 0, 300, 'silver', 'fixed', true),
('Exclusive Preview', 'Early access to new collection', 'exclusive_view', 0, 200, 'gold', 'always', true),
('Flash Sale 50%', '50% off clearance items', 'flash', 50, 0, 'bronze', 'flash', true);

INSERT INTO products (name, description, price, category, is_active) VALUES
('Premium Coffee Maker', 'State-of-the-art coffee machine', 299, 'appliances', true),
('Wireless Earbuds Pro', 'High-quality audio with ANC', 199, 'electronics', true),
('Yoga Mat Premium', 'Eco-friendly non-slip yoga mat', 49, 'fitness', true),
('Smart Watch Series X', 'Advanced fitness tracking', 349, 'electronics', true),
('Designer Handbag', 'Elegant leather handbag', 179, 'fashion', true),
('Blender Set Professional', 'High-performance kitchen blender', 129, 'appliances', true);
```

## Row Level Security

Run this **once** to enable RLS and allow anonymous access:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow anon select users" ON users;
DROP POLICY IF EXISTS "Allow anon select transactions" ON transactions;
DROP POLICY IF EXISTS "Allow anon select offers" ON offers;
DROP POLICY IF EXISTS "Allow anon select products" ON products;
DROP POLICY IF EXISTS "Allow anon select redemptions" ON redemptions;
DROP POLICY IF EXISTS "Allow anon insert users" ON users;
DROP POLICY IF EXISTS "Allow anon insert transactions" ON transactions;
DROP POLICY IF EXISTS "Allow anon insert redemptions" ON redemptions;
DROP POLICY IF EXISTS "Allow anon update users" ON users;

-- Allow anonymous reads (required for the app to load data)
CREATE POLICY "Allow anon select users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow anon select transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow anon select offers" ON offers FOR SELECT USING (true);
CREATE POLICY "Allow anon select products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow anon select redemptions" ON redemptions FOR SELECT USING (true);

-- Allow anonymous inserts for user creation and transactions
CREATE POLICY "Allow anon insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert redemptions" ON redemptions FOR INSERT WITH CHECK (true);

-- Allow anonymous updates for points and user data
CREATE POLICY "Allow anon update users" ON users FOR UPDATE USING (true);
```
