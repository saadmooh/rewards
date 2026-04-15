-- ============================================================
--  Rewards Dashboard — Consolidated Migration
--  Engine : PostgreSQL (Supabase)
--  Safe to run on any existing database derived from schema v2.0
--  All statements are idempotent (IF NOT EXISTS / OR REPLACE).
-- ============================================================


-- ============================================================
--  1. STORES — Points-expiry columns
-- ============================================================

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS points_expiry_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS points_expiry_months  INTEGER     NOT NULL DEFAULT 12;


-- ============================================================
--  2. USER_STORE_MEMBERSHIPS — Points-tracking column
-- ============================================================

ALTER TABLE public.user_store_memberships
  ADD COLUMN IF NOT EXISTS points_earned_at TIMESTAMPTZ;


-- ============================================================
--  3. REDEMPTIONS — Coupon & product columns
-- ============================================================

-- 3a. Core columns
ALTER TABLE public.redemptions
  ADD COLUMN IF NOT EXISTS points_spent           INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_applied       INTEGER,
  ADD COLUMN IF NOT EXISTS coupon_code            VARCHAR(10),
  ADD COLUMN IF NOT EXISTS products               JSONB;
-- ============================================================
--  3b. Normalise expiry column name
--     Older migrations may have created "expires_at"; rename it if present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'redemptions'
       AND column_name  = 'expires_at'
  ) THEN
    -- Ensure target column exists before copying
    ALTER TABLE public.redemptions
      ADD COLUMN IF NOT EXISTS coupon_code_expires_at TIMESTAMPTZ;

    UPDATE public.redemptions
       SET coupon_code_expires_at = expires_at
     WHERE coupon_code_expires_at IS NULL;

    ALTER TABLE public.redemptions DROP COLUMN expires_at;
  ELSE
    ALTER TABLE public.redemptions
      ADD COLUMN IF NOT EXISTS coupon_code_expires_at TIMESTAMPTZ;
  END IF;
END $$;


-- ============================================================
--  3c. PROMOTIONS — Automated campaign columns (v2.0)
-- ============================================================

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS trigger_type      TEXT      DEFAULT 'manual'
    CHECK (trigger_type IN ('manual','welcome','win_back','birthday','churn','tier_upgrade','milestone')),
  ADD COLUMN IF NOT EXISTS trigger_condition JSONB,
  ADD COLUMN IF NOT EXISTS status            TEXT      DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','completed')),
  ADD COLUMN IF NOT EXISTS message_template  JSONB,
  ADD COLUMN IF NOT EXISTS offer_id          UUID      REFERENCES public.offers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_run_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS send_count        INTEGER   NOT NULL DEFAULT 0;


-- ============================================================
--  4. PENDING_POINT_CLAIMS — Door / QR claim table
-- ============================================================


CREATE TABLE IF NOT EXISTS public.pending_point_claims (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       UUID        REFERENCES public.stores                 (id) ON DELETE CASCADE,
  user_id        UUID        REFERENCES public.users                  (id) ON DELETE CASCADE,
  membership_id  UUID        REFERENCES public.user_store_memberships (id) ON DELETE CASCADE,

  status         VARCHAR(20) NOT NULL DEFAULT 'waiting',   -- waiting | claimed | expired
  amount_claimed NUMERIC,
  points_claimed INTEGER,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ,
  claimed_at     TIMESTAMPTZ
);


-- ============================================================
--  4b. DELIVERIES — Order tracking table (v2.1)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.deliveries (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    store_id       UUID        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id     UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    wilaya         TEXT        NOT NULL,
    municipality   TEXT        NOT NULL,
    address        TEXT        NOT NULL,
    delivery_type  TEXT        NOT NULL CHECK (delivery_type IN ('home', 'office')),
    payment_method TEXT        NOT NULL DEFAULT 'cod',
    status         TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
--  4c. CAMPAIGN_LOGS — Automated send tracking (v2.0)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.campaign_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID      NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  promotion_id  UUID      NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id       UUID      NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  status        TEXT      NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','skipped','failed','opted_out')),
  error_message TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
--  5. INDEXES
-- ============================================================

-- user_store_memberships
CREATE INDEX IF NOT EXISTS idx_memberships_points_earned_at
  ON public.user_store_memberships (points_earned_at);

-- redemptions
DROP INDEX IF EXISTS idx_redemptions_expires_at;           -- legacy name
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon_code
  ON public.redemptions (coupon_code);
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon_expiry
  ON public.redemptions (coupon_code_expires_at);

-- pending_point_claims
CREATE INDEX IF NOT EXISTS idx_claims_store_status
  ON public.pending_point_claims (store_id, status);
CREATE INDEX IF NOT EXISTS idx_claims_user_store
  ON public.pending_point_claims (user_id,  store_id);
CREATE INDEX IF NOT EXISTS idx_claims_expires_at
  ON public.pending_point_claims (expires_at);

-- deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_user_id  ON public.deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_store_id ON public.deliveries(store_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status   ON public.deliveries(status);

-- campaign_logs
CREATE INDEX IF NOT EXISTS idx_campaign_logs_store_id     ON public.campaign_logs (store_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_promotion_id ON public.campaign_logs (promotion_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_user_id      ON public.campaign_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_sent_at      ON public.campaign_logs (sent_at);


-- ============================================================
--  6. ROW-LEVEL SECURITY — pending_point_claims & deliveries
--     Follows the open-policy pattern used by all other tables
--     (app authenticates via Telegram, not Supabase auth.uid()).
-- ============================================================

ALTER TABLE public.pending_point_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

-- pending_point_claims
DROP POLICY IF EXISTS "pending_point_claims_select" ON public.pending_point_claims;
DROP POLICY IF EXISTS "pending_point_claims_insert" ON public.pending_point_claims;
DROP POLICY IF EXISTS "pending_point_claims_update" ON public.pending_point_claims;
DROP POLICY IF EXISTS "pending_point_claims_delete" ON public.pending_point_claims;

CREATE POLICY "pending_point_claims_select" ON public.pending_point_claims FOR SELECT USING      (TRUE);
CREATE POLICY "pending_point_claims_insert" ON public.pending_point_claims FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "pending_point_claims_update" ON public.pending_point_claims FOR UPDATE USING      (TRUE);
CREATE POLICY "pending_point_claims_delete" ON public.pending_point_claims FOR DELETE USING      (TRUE);

-- deliveries
DROP POLICY IF EXISTS "deliveries_select" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_insert" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_update" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_delete" ON public.deliveries;

CREATE POLICY "deliveries_select" ON public.deliveries FOR SELECT USING (TRUE);
CREATE POLICY "deliveries_insert" ON public.deliveries FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "deliveries_update" ON public.deliveries FOR UPDATE USING (TRUE);
CREATE POLICY "deliveries_delete" ON public.deliveries FOR DELETE USING (TRUE);

-- campaign_logs
DROP POLICY IF EXISTS "campaign_logs_select" ON public.campaign_logs;
DROP POLICY IF EXISTS "campaign_logs_insert" ON public.campaign_logs;
DROP POLICY IF EXISTS "campaign_logs_update" ON public.campaign_logs;
DROP POLICY IF EXISTS "campaign_logs_delete" ON public.campaign_logs;

CREATE POLICY "campaign_logs_select" ON public.campaign_logs FOR SELECT USING (TRUE);
CREATE POLICY "campaign_logs_insert" ON public.campaign_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "campaign_logs_update" ON public.campaign_logs FOR UPDATE USING (TRUE);
CREATE POLICY "campaign_logs_delete" ON public.campaign_logs FOR DELETE USING (TRUE);


-- ============================================================
--  7. FUNCTIONS
-- ============================================================

-- ─────────────────────────────────────────────
--  generate_coupon_code()
--  Returns a random zero-padded 4-digit code.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_coupon_code()
RETURNS VARCHAR(4)
LANGUAGE plpgsql AS
$$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$;

-- ─────────────────────────────────────────────
--  update_points_earned_at()
--  Stamp the timestamp whenever points increase.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_points_earned_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS
$$
BEGIN
  IF NEW.points > OLD.points THEN
    NEW.points_earned_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────
--  update_user_tier()
--  Promotes / demotes tier after every points update.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_user_tier()
RETURNS TRIGGER
LANGUAGE plpgsql AS
$$
DECLARE
  v_tier_config JSONB;
  v_new_tier    TEXT;
BEGIN
  SELECT tier_config
    INTO v_tier_config
    FROM public.stores
   WHERE id = NEW.store_id;

  v_new_tier :=
    CASE
      WHEN NEW.points >= (v_tier_config->>'platinum')::INTEGER THEN 'platinum'
      WHEN NEW.points >= (v_tier_config->>'gold')::INTEGER     THEN 'gold'
      WHEN NEW.points >= (v_tier_config->>'silver')::INTEGER   THEN 'silver'
      ELSE 'bronze'
    END;

  IF v_new_tier IS DISTINCT FROM OLD.tier THEN
    UPDATE public.user_store_memberships
       SET tier       = v_new_tier,
           updated_at = NOW()
     WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────
--  expire_old_points()
--  Called manually or via pg_cron.
--  Zeros out points that have passed their expiry window.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_old_points()
RETURNS VOID
LANGUAGE plpgsql AS
$$
DECLARE
  v_rec           RECORD;
  v_expired_count INTEGER := 0;
BEGIN
  FOR v_rec IN
    SELECT m.id,
           m.points,
           m.store_id,
           m.user_id,
           s.points_expiry_months
      FROM public.user_store_memberships m
      JOIN public.stores                 s ON s.id = m.store_id
     WHERE s.points_expiry_enabled = TRUE
       AND m.points                > 0
       AND m.points_earned_at      IS NOT NULL
       AND m.points_earned_at      < NOW() - (s.points_expiry_months || ' months')::INTERVAL
  LOOP
    INSERT INTO public.transactions
      (store_id, user_id, membership_id, type, points, description)
    VALUES
      (v_rec.store_id, v_rec.user_id, v_rec.id, 'expire', -v_rec.points, 'انتهاء صلاحية النقاط');

    UPDATE public.user_store_memberships
       SET points           = 0,
           points_earned_at = NULL,
           updated_at       = NOW()
     WHERE id = v_rec.id;

    v_expired_count := v_expired_count + 1;
  END LOOP;

  RAISE NOTICE 'Expired points for % memberships', v_expired_count;
END;
$$;


-- ============================================================
--  8. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trg_points_earned_at ON public.user_store_memberships;
CREATE TRIGGER trg_points_earned_at
  BEFORE UPDATE OF points ON public.user_store_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_points_earned_at();

DROP TRIGGER IF EXISTS trg_update_tier ON public.user_store_memberships;
CREATE TRIGGER trg_update_tier
  AFTER UPDATE OF points ON public.user_store_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_tier();


-- ============================================================
--  9. CASH ON DELIVERY & REFERRAL SYSTEM (v2.1)
-- ============================================================

-- 9a. STORES — COD Toggle & Referral Reward Points
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS is_cod_enabled          BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS referral_reward_points  INTEGER     NOT NULL DEFAULT 200;

-- 9b. USER_STORE_MEMBERSHIPS — Referral tracking
ALTER TABLE public.user_store_memberships
  ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 9c. INDEXES — Referral tracking
CREATE INDEX IF NOT EXISTS idx_memberships_referred_by 
  ON public.user_store_memberships (referred_by_id);


-- ============================================================
--  10. OPTIONAL — Scheduled expiry via pg_cron
-- ============================================================

-- SELECT cron.schedule(
--   'expire-old-points',
--   '0 0 * * *',
--   'SELECT public.expire_old_points()'
-- );


-- ============================================================
--  END OF MIGRATION
-- ============================================================