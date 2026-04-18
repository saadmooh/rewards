-- ============================================================
--  Offer Packages - Mystery Gift Boxes
-- ============================================================

-- offer_packages table - packages that users receive
CREATE TABLE IF NOT EXISTS public.offer_packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  icon            TEXT DEFAULT '🎁',
  reward_type     TEXT NOT NULL CHECK (reward_type IN ('points', 'discount', 'gift', 'double_points', 'mixed')),
  reward_value    INTEGER NOT NULL,
  reward_items    JSONB,
  min_wait_hours  INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  valid_until     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offer_packages_store_id ON public.offer_packages (store_id);
CREATE INDEX IF NOT EXISTS idx_offer_packages_status ON public.offer_packages (status);

-- offer_package_claims - user instances of packages
CREATE TABLE IF NOT EXISTS public.offer_package_claims (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id  UUID NOT NULL REFERENCES public.offer_packages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  is_opened   BOOLEAN DEFAULT FALSE,
  opened_at   TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offer_package_claims_user_id ON public.offer_package_claims (user_id);
CREATE INDEX IF NOT EXISTS idx_offer_package_claims_store_id ON public.offer_package_claims (store_id);

-- RLS
ALTER TABLE public.offer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_package_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offer_packages_select" ON public.offer_packages;
DROP POLICY IF EXISTS "offer_packages_insert" ON public.offer_packages;
DROP POLICY IF EXISTS "offer_packages_update" ON public.offer_packages;
DROP POLICY IF EXISTS "offer_packages_delete" ON public.offer_packages;

CREATE POLICY "offer_packages_select" ON public.offer_packages FOR SELECT USING (TRUE);
CREATE POLICY "offer_packages_insert" ON public.offer_packages FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "offer_packages_update" ON public.offer_packages FOR UPDATE USING (TRUE);
CREATE POLICY "offer_packages_delete" ON public.offer_packages FOR DELETE USING (TRUE);

DROP POLICY IF EXISTS "offer_package_claims_select" ON public.offer_package_claims;
DROP POLICY IF EXISTS "offer_package_claims_insert" ON public.offer_package_claims;
DROP POLICY IF EXISTS "offer_package_claims_update" ON public.offer_package_claims;
DROP POLICY IF EXISTS "offer_package_claims_delete" ON public.offer_package_claims;

CREATE POLICY "offer_package_claims_select" ON public.offer_package_claims FOR SELECT USING (TRUE);
CREATE POLICY "offer_package_claims_insert" ON public.offer_package_claims FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "offer_package_claims_update" ON public.offer_package_claims FOR UPDATE USING (TRUE);
CREATE POLICY "offer_package_claims_delete" ON public.offer_package_claims FOR DELETE USING (TRUE);