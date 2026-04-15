-- Phase 1: Database Schema Changes

-- 1.1 Create Pending Claims Table
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

-- 1.2 Add Indexes
-- Index on (store_id, status) for fast lookups of waiting claims for a store
CREATE INDEX IF NOT EXISTS idx_pending_point_claims_store_status ON pending_point_claims (store_id, status);
-- Index on (user_id, store_id) to prevent duplicates and for quick user checks
CREATE INDEX IF NOT EXISTS idx_pending_point_claims_user_store ON pending_point_claims (user_id, store_id);
-- Index on expires_at for potential cleanup jobs
CREATE INDEX IF NOT EXISTS idx_pending_point_claims_expires_at ON pending_point_claims (expires_at);

-- Enable RLS for the new table
ALTER TABLE pending_point_claims ENABLE ROW LEVEL SECURITY;

-- Policies for pending_point_claims
-- Policy for users to create claims
CREATE POLICY "Users can create pending claims for their store" ON pending_point_claims FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM stores WHERE id = store_id AND owner_email = auth.jwt()->>'email') OR
  (EXISTS (SELECT 1 FROM users WHERE id = user_id AND telegram_id IS NOT NULL))
);
CREATE POLICY "Users can view their own pending claims" ON pending_point_claims FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Store owners/admins can manage pending claims for their store" ON pending_point_claims FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE id = store_id AND owner_email = auth.jwt()->>'email')
);

-- Note: The 'generate_coupon_code' function and associated columns were handled in a previous migration (002).
-- This migration focuses on the 'pending_point_claims' table itself.
