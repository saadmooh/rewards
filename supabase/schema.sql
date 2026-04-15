-- Schema Definitions Consolidated from Migration Files

-- Functions
CREATE OR REPLACE FUNCTION generate_coupon_code()
RETURNS VARCHAR(4) AS $$
BEGIN
  RETURN LPAD(FLOOR(random() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Tables and Columns
CREATE TABLE IF NOT EXISTS pending_point_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES user_store_memberships(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'claimed', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ NULL,
  amount_claimed NUMERIC NULL,
  points_claimed INTEGER NULL
);

CREATE TABLE IF NOT EXISTS offer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(offer_id, product_id)
);

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    wilaya TEXT NOT NULL,
    municipality TEXT NOT NULL,
    address TEXT NOT NULL,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('home', 'office')),
    payment_method TEXT NOT NULL DEFAULT 'cod',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alterations to existing tables
-- From 002_add_coupon_details_to_redemptions.sql and redemptions_coupon.sql
ALTER TABLE redemptions
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(10), -- Original was VARCHAR(4), using VARCHAR(10) from redemptions_coupon.sql for broader compatibility
ADD COLUMN IF NOT EXISTS coupon_code_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS products JSONB;

-- From 006_add_cod_toggle_to_stores.sql and 007_add_referral_tracking.sql
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS is_cod_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS referral_reward_points INTEGER NOT NULL DEFAULT 200;

ALTER TABLE user_store_memberships
ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon_code ON redemptions (coupon_code);
CREATE INDEX IF NOT EXISTS idx_memberships_referred_by ON user_store_memberships (referred_by_id);

-- Indexes for pending_point_claims
-- From 003_create_pending_claims.sql and pending_point_claims.sql
-- Consolidating indexes, prioritizing unique ones and more specific WHERE clauses where applicable.
-- Using WHERE clause from pending_point_claims.sql for idx_pending_claims_store_status as it's more specific.
CREATE INDEX IF NOT EXISTS idx_pending_point_claims_store_status ON pending_point_claims (store_id, status) WHERE status = 'waiting'; -- From pending_point_claims.sql
-- Index on (user_id, store_id) to prevent duplicates and for quick user checks
CREATE INDEX IF NOT EXISTS idx_pending_point_claims_user_store ON pending_point_claims (user_id, store_id); -- From 003_create_pending_claims.sql
-- Index for potential cleanup jobs or ordering
CREATE INDEX IF NOT EXISTS idx_pending_point_claims_expires_at ON pending_point_claims (expires_at); -- From 003_create_pending_claims.sql
CREATE INDEX IF NOT EXISTS idx_pending_claims_created_at ON pending_point_claims(created_at DESC); -- From pending_point_claims.sql

-- Indexes for deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_store_id ON deliveries(store_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- Row Level Security (RLS) Enforcement
ALTER TABLE pending_point_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Row Level Security (RLS) Policies

-- Policies for deliveries (Open policies like setup.sql)
CREATE POLICY "deliveries_select" ON deliveries FOR SELECT USING (TRUE);
CREATE POLICY "deliveries_insert" ON deliveries FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "deliveries_update" ON deliveries FOR UPDATE USING (TRUE);
CREATE POLICY "deliveries_delete" ON deliveries FOR DELETE USING (TRUE);

-- Policies for pending_point_claims
-- Note: Combining policies from 003 and pending_point_claims.sql. Prioritizing the more specific/comprehensive one for insert.
-- Using the INSERT policy from pending_point_claims.sql as it specifies 'WITH CHECK'.
-- Using the SELECT policy from pending_point_claims.sql as it includes store owner check.
-- Using the ALL policy from pending_point_claims.sql for management.

CREATE POLICY "Users can create pending claims for their store" ON pending_point_claims FOR INSERT WITH CHECK (
  user_id = auth.uid() -- Assuming customers create their own claims via app
);
-- This policy from 003 has a different logic: 'EXISTS (SELECT 1 FROM stores WHERE id = store_id AND owner_id = auth.uid()) OR (EXISTS (SELECT 1 FROM users WHERE id = user_id AND telegram_id IS NOT NULL))'
-- Reverting to the simpler user_id = auth.uid() based on common app flow. If store owners should create claims, this needs clarification.

CREATE POLICY "Users can view their own pending claims" ON pending_point_claims FOR SELECT 
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM stores WHERE id = store_id AND owner_id = auth.uid()
  )); -- From pending_point_claims.sql

CREATE POLICY "Store owners can manage all pending claims" ON pending_point_claims FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM stores WHERE id = store_id AND owner_id = auth.uid()
  )); -- From pending_point_claims.sql

-- Policies for offer_products
CREATE POLICY "Users can view offer_products" ON offer_products FOR SELECT USING (true);
CREATE POLICY "Owners can manage offer_products" ON offer_products FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE id IN (SELECT store_id FROM offers WHERE id = offer_id) AND owner_id = auth.uid())
);

-- Note: The original migrations had some overlap or redundancy (e.g., pending_point_claims creation and policies).
-- This consolidated version attempts to merge them logically, prioritizing the more detailed or recent definitions.
-- 'redemptions_coupon.sql' applies to the existing 'redemptions' table.
-- '002_add_coupon_details_to_redemptions.sql' also alters 'redemptions' table. I've merged columns from both.
