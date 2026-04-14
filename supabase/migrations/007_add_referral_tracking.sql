-- Add referred_by_id to user_store_memberships to track who invited the user
ALTER TABLE public.user_store_memberships
ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add referral reward settings to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS referral_reward_points INTEGER NOT NULL DEFAULT 200;

-- Index for referral tracking
CREATE INDEX IF NOT EXISTS idx_memberships_referred_by ON public.user_store_memberships(referred_by_id);
