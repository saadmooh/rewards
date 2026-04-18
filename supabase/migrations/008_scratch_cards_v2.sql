-- ============================================================
--  Scratch-to-Win — Database Schema (Updated RLS)
--  Engine : PostgreSQL (Supabase)
-- ============================================================

-- 1. scratch_cards table — Campaign Configuration
CREATE TABLE IF NOT EXISTS public.scratch_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  reward_type     TEXT NOT NULL CHECK (reward_type IN ('points', 'discount', 'gift', 'double_points')),
  reward_value    INTEGER NOT NULL,
  reward_metadata JSONB,
  trigger_type    TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'birthday', 'tier_upgrade', 'welcome')),
  surface_color   TEXT DEFAULT '#D4AF37',
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  valid_until     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scratch_cards_store_id ON public.scratch_cards (store_id);
CREATE INDEX IF NOT EXISTS idx_scratch_cards_status ON public.scratch_cards (status);

-- 2. scratch_card_claims table — User Instances
CREATE TABLE IF NOT EXISTS public.scratch_card_claims (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     UUID NOT NULL REFERENCES public.scratch_cards(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  is_revealed BOOLEAN DEFAULT FALSE,
  is_redeemed BOOLEAN DEFAULT FALSE,
  revealed_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scratch_card_claims_card_id ON public.scratch_card_claims (card_id);
CREATE INDEX IF NOT EXISTS idx_scratch_card_claims_user_id ON public.scratch_card_claims (user_id);
CREATE INDEX IF NOT EXISTS idx_scratch_card_claims_store_id ON public.scratch_card_claims (store_id);

-- 3. RLS for scratch_cards
ALTER TABLE public.scratch_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scratch_cards_select" ON public.scratch_cards;
DROP POLICY IF EXISTS "scratch_cards_insert" ON public.scratch_cards;
DROP POLICY IF EXISTS "scratch_cards_update" ON public.scratch_cards;
DROP POLICY IF EXISTS "scratch_cards_delete" ON public.scratch_cards;

CREATE POLICY "scratch_cards_select" ON public.scratch_cards FOR SELECT USING (TRUE);
CREATE POLICY "scratch_cards_insert" ON public.scratch_cards FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "scratch_cards_update" ON public.scratch_cards FOR UPDATE USING (TRUE);
CREATE POLICY "scratch_cards_delete" ON public.scratch_cards FOR DELETE USING (TRUE);

-- 4. RLS for scratch_card_claims (simplified for Telegram app)
ALTER TABLE public.scratch_card_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scratch_card_claims_select" ON public.scratch_card_claims;
DROP POLICY IF EXISTS "scratch_card_claims_insert" ON public.scratch_card_claims;
DROP POLICY IF EXISTS "scratch_card_claims_update" ON public.scratch_card_claims;
DROP POLICY IF EXISTS "scratch_card_claims_delete" ON public.scratch_card_claims;

CREATE POLICY "scratch_card_claims_select" ON public.scratch_card_claims FOR SELECT USING (TRUE);
CREATE POLICY "scratch_card_claims_insert" ON public.scratch_card_claims FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "scratch_card_claims_update" ON public.scratch_card_claims FOR UPDATE USING (TRUE);
CREATE POLICY "scratch_card_claims_delete" ON public.scratch_card_claims FOR DELETE USING (TRUE);