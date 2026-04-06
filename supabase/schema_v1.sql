-- ============================================================
--  Rewards Dashboard — Database Schema v1
--  Engine : PostgreSQL (Supabase)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS
  pending_point_claims,
  redemptions,
  transactions,
  promotions,
  offer_products,
  offers,
  products,
  user_store_memberships,
  roles,
  stores,
  users
CASCADE;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- users
-- Identified by telegram_id; no auth.users dependency.
CREATE TABLE public.users (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id      BIGINT    UNIQUE,
  username         TEXT      UNIQUE,
  full_name        TEXT,
  phone            TEXT,
  birth_date       DATE,
  gender           TEXT     CHECK (gender IN ('male', 'female')),
  language_code   TEXT,
  avatar_url       TEXT,
  photo_url       TEXT,

  role             TEXT     NOT NULL DEFAULT 'user'
                             CHECK (role IN ('user', 'admin', 'super_admin')),
  is_super_admin  BOOLEAN   NOT NULL DEFAULT FALSE,
  permissions     TEXT[]   NOT NULL DEFAULT ARRAY['read']::TEXT[],

  is_bot           BOOLEAN   NOT NULL DEFAULT FALSE,
  is_premium      BOOLEAN   NOT NULL DEFAULT FALSE,

  last_active     TIMESTAMPTZ,
  raw_telegram_data JSONB,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- roles – granular permission profiles
CREATE TABLE public.roles (
  id          UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT      NOT NULL,
  slug        TEXT      UNIQUE NOT NULL,
  permissions JSONB     NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.roles (name, slug, permissions) VALUES
  ('Owner',   'owner',   '{"can_access_dashboard":true,"manage_products":true,"manage_offers":true,"manage_customers":true,"view_stats":true,"issue_points":true,"redeem_points":true}'),
  ('Manager', 'manager', '{"can_access_dashboard":true,"manage_products":true,"manage_offers":true,"manage_customers":true,"view_stats":true,"issue_points":true,"redeem_points":true}'),
  ('Cashier', 'cashier', '{"can_access_dashboard":true,"manage_products":false,"manage_offers":false,"manage_customers":true,"view_stats":false,"issue_points":true,"redeem_points":true}'),
  ('Client',  'client',  '{"can_access_dashboard":false,"manage_products":false,"manage_offers":false,"manage_customers":false,"view_stats":false,"issue_points":false,"redeem_points":false}');

-- stores
CREATE TABLE public.stores (
  id               UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email      TEXT      NOT NULL,
  owner_username   TEXT      NOT NULL,
  name             TEXT      NOT NULL,
  slug             TEXT      UNIQUE NOT NULL,
  description      TEXT,
  logo_url         TEXT,
  phone            TEXT,
  address          TEXT,
  city             TEXT,
  category         TEXT,

  tier_config      JSONB     NOT NULL DEFAULT '{"bronze":0,"silver":10000,"gold":50000,"platinum":100000}',
  points_rate      INTEGER   NOT NULL DEFAULT 1,
  welcome_points  INTEGER   NOT NULL DEFAULT 100,
  primary_color   TEXT      NOT NULL DEFAULT '#D4AF37',
  plan            TEXT      NOT NULL DEFAULT 'basic',

  ad_points_balance INTEGER   NOT NULL DEFAULT 0,

  bot_token       TEXT,
  bot_username   TEXT,

  is_active      BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- products
CREATE TABLE public.products (
  id               UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id         UUID      NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  name             TEXT      NOT NULL,
  description     TEXT,
  price           INTEGER   NOT NULL,
  category        TEXT      NOT NULL DEFAULT 'عام',
  image_url       TEXT,
  is_exclusive    BOOLEAN   NOT NULL DEFAULT FALSE,
  min_tier_to_view TEXT     NOT NULL DEFAULT 'bronze'
                           CHECK (min_tier_to_view IN ('bronze','silver','gold','platinum')),
  is_active      BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- offers
CREATE TABLE public.offers (
  id               UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id         UUID      NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  title            TEXT      NOT NULL,
  description     TEXT,
  type             TEXT     NOT NULL
                           CHECK (type IN ('discount','gift','double_points','flash','exclusive')),
  target_type     TEXT     NOT NULL DEFAULT 'all'
                           CHECK (target_type IN ('all','products')),
  discount_percent INTEGER,
  points_cost    INTEGER   NOT NULL DEFAULT 0,
  min_tier       TEXT     NOT NULL DEFAULT 'bronze'
                           CHECK (min_tier IN ('bronze','silver','gold','platinum')),
  occasion_type  TEXT     NOT NULL DEFAULT 'always'
                           CHECK (occasion_type IN ('always','fixed','birthday','anniversary','win_back','flash')),
  occasion_date  DATE,
  valid_from     TIMESTAMPTZ,
  valid_until   TIMESTAMPTZ,
  usage_limit   INTEGER,
  image_url     TEXT,
  is_active    BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- offer_products – many-to-many join
CREATE TABLE public.offer_products (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id   UUID     NOT NULL REFERENCES public.offers   (id) ON DELETE CASCADE,
  product_id UUID     NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (offer_id, product_id)
);

-- user_store_memberships
CREATE TABLE public.user_store_memberships (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID     NOT NULL REFERENCES public.users  (id) ON DELETE CASCADE,
  store_id      UUID     NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  role_id       UUID     REFERENCES public.roles (id) ON DELETE SET NULL,

  points        INTEGER   NOT NULL DEFAULT 0,
  tier          TEXT     NOT NULL DEFAULT 'bronze'
                           CHECK (tier IN ('bronze','silver','gold','platinum')),
  total_spent   INTEGER   NOT NULL DEFAULT 0,
  visit_count   INTEGER   NOT NULL DEFAULT 0,
  last_purchase TIMESTAMPTZ,

  referral_code TEXT     UNIQUE DEFAULT SUBSTR(MD5(RANDOM()::TEXT), 1, 8),

  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, store_id)
);

-- transactions
CREATE TABLE public.transactions (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id      UUID      NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  user_id      UUID      REFERENCES public.users  (id) ON DELETE CASCADE,
  membership_id UUID     REFERENCES public.user_store_memberships (id) ON DELETE CASCADE,
  offer_id     UUID     REFERENCES public.offers (id) ON DELETE SET NULL,

  type         TEXT     NOT NULL
                     CHECK (type IN ('earn','redeem','adjust','expire','welcome')),
  points       INTEGER   NOT NULL,
  amount       INTEGER,
  note         TEXT,
  description  TEXT,

  qr_token     TEXT     UNIQUE,
  qr_used      BOOLEAN   NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- redemptions
CREATE TABLE public.redemptions (
  id                UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID      NOT NULL REFERENCES public.users  (id) ON DELETE CASCADE,
  store_id          UUID      NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  offer_id          UUID      NOT NULL REFERENCES public.offers (id) ON DELETE CASCADE,
  points_spent     INTEGER   NOT NULL,
  discount_applied INTEGER,

  coupon_code           VARCHAR(10),
  coupon_code_expires_at  TIMESTAMPTZ,
  products               JSONB,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- promotions – advertising campaigns
CREATE TABLE public.promotions (
  id           UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id     UUID      NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  title        TEXT      NOT NULL,
  body         TEXT,
  image_url    TEXT,
  cta_label    TEXT      NOT NULL DEFAULT 'اكتشف المتجر',
  cta_url      TEXT,

  target_tiers    TEXT[]  NOT NULL DEFAULT ARRAY['bronze','silver','gold','platinum'],
  target_gender   TEXT     CHECK (target_gender IN ('male','female')),
  target_city     TEXT,
  target_min_spent INTEGER,

  reward_points INTEGER   NOT NULL DEFAULT 50,
  budget_points INTEGER   NOT NULL DEFAULT 1000,

  starts_at   TIMESTAMPTZ,
  ends_at    TIMESTAMPTZ,
  is_active  BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- pending_point_claims
CREATE TABLE public.pending_point_claims (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID     REFERENCES public.stores               (id) ON DELETE CASCADE,
  user_id       UUID     REFERENCES public.users                (id) ON DELETE CASCADE,
  membership_id UUID     REFERENCES public.user_store_memberships (id) ON DELETE CASCADE,

  status       VARCHAR(20) NOT NULL DEFAULT 'waiting',
  amount_claimed NUMERIC,
  points_claimed INTEGER,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  claimed_at  TIMESTAMPTZ
);

-- ============================================================
-- STORAGE
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT DO NOTHING;

DO $$ BEGIN
  DROP POLICY IF EXISTS "product_images_select" ON storage.objects;
  DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
  DROP POLICY IF EXISTS "product_images_update" ON storage.objects;
  DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;
END $$;

CREATE POLICY "product_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "product_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product_images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
CREATE POLICY "product_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_store_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_point_claims ENABLE ROW LEVEL SECURITY;

DO $policies$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users','roles','stores','products','offers','offer_products',
    'user_store_memberships','transactions','redemptions','promotions',
    'pending_point_claims'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS "%s_select" ON public.%I', tbl, tbl);
    EXECUTE FORMAT('DROP POLICY IF EXISTS "%s_insert" ON public.%I', tbl, tbl);
    EXECUTE FORMAT('DROP POLICY IF EXISTS "%s_update" ON public.%I', tbl, tbl);
    EXECUTE FORMAT('DROP POLICY IF EXISTS "%s_delete" ON public.%I', tbl, tbl);
    EXECUTE FORMAT('CREATE POLICY "%s_select" ON public.%I FOR SELECT USING (TRUE)',      tbl, tbl);
    EXECUTE FORMAT('CREATE POLICY "%s_insert" ON public.%I FOR INSERT WITH CHECK (TRUE)', tbl, tbl);
    EXECUTE FORMAT('CREATE POLICY "%s_update" ON public.%I FOR UPDATE USING (TRUE)',      tbl, tbl);
    EXECUTE FORMAT('CREATE POLICY "%s_delete" ON public.%I FOR DELETE USING (TRUE)',      tbl, tbl);
  END LOOP;
END;
$policies$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_products_store_id   ON public.products              (store_id);
CREATE INDEX idx_offers_store_id     ON public.offers                (store_id);
CREATE INDEX idx_offer_products_offer_id   ON public.offer_products   (offer_id);
CREATE INDEX idx_offer_products_product_id ON public.offer_products (product_id);
CREATE INDEX idx_memberships_store_id  ON public.user_store_memberships (store_id);
CREATE INDEX idx_memberships_user_id    ON public.user_store_memberships (user_id);
CREATE INDEX idx_transactions_store_id   ON public.transactions        (store_id);
CREATE INDEX idx_transactions_user_id  ON public.transactions        (user_id);
CREATE INDEX idx_redemptions_coupon_code ON public.redemptions      (coupon_code);
CREATE INDEX idx_claims_store_status   ON public.pending_point_claims (store_id, status);
CREATE INDEX idx_claims_user_store   ON public.pending_point_claims (user_id, store_id);
CREATE INDEX idx_claims_expires_at ON public.pending_point_claims (expires_at);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_user_tier()
RETURNS TRIGGER
LANGUAGE plpgsql AS
$$
DECLARE
  v_tier_config JSONB;
  v_new_tier  TEXT;
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

DROP TRIGGER IF EXISTS trg_update_tier ON public.user_store_memberships;

CREATE TRIGGER trg_update_tier
  AFTER UPDATE OF points ON public.user_store_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_tier();