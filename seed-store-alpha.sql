-- ============================================================
--  Rewards Dashboard — Database Schema
--  Engine : PostgreSQL (Supabase)
--  Version: 2.0 (Consolidated)
--  Generated: 2026-04-06
-- ============================================================

-- ─────────────────────────────────────────────
--  Extensions
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
--  Tear-down (reverse dependency order)
-- ─────────────────────────────────────────────
DROP TABLE IF EXISTS
  pending_point_claims,
  ad_impressions,
  user_behavior_tags,
  cross_promotions,
  redemptions,
  transactions,
  promotions,
  offer_products,
  offers,
  products,
  user_store_memberships,
  referrals,
  roles,
  stores,
  users
CASCADE;


-- ============================================================
--  CORE TABLES
-- ============================================================

-- ─────────────────────────────────────────────
--  users
--  Identified by telegram_id; no auth.users dependency.
-- ─────────────────────────────────────────────
CREATE TABLE public.users (
  id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id              BIGINT        UNIQUE,
  username                 TEXT          UNIQUE,
  full_name                TEXT,
  phone                    TEXT,
  phone_number             TEXT,                          -- raw field from Telegram payload
  birth_date               DATE,
  gender                   TEXT          CHECK (gender IN ('male', 'female')),
  language_code            TEXT,
  avatar_url               TEXT,
  photo_url                TEXT,

  -- Role & access
  role                     TEXT          NOT NULL DEFAULT 'user'
                                         CHECK (role IN ('user', 'admin', 'super_admin')),
  is_super_admin           BOOLEAN       NOT NULL DEFAULT FALSE,
  permissions              TEXT[]        NOT NULL DEFAULT ARRAY['read']::TEXT[],

  -- Telegram flags
  is_bot                   BOOLEAN       NOT NULL DEFAULT FALSE,
  is_premium               BOOLEAN       NOT NULL DEFAULT FALSE,
  allows_write_to_pm       BOOLEAN       NOT NULL DEFAULT FALSE,
  added_to_attachment_menu BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Points & activity
  ad_points_balance        INTEGER       NOT NULL DEFAULT 0,
  last_active              TIMESTAMPTZ,
  raw_telegram_data        JSONB,

  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  roles  –  granular permission profiles
-- ─────────────────────────────────────────────
CREATE TABLE public.roles (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  permissions JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.roles (name, slug, permissions) VALUES
  ('Owner',   'owner',   '{"can_access_dashboard":true,"manage_products":true,"manage_offers":true,"manage_customers":true,"view_stats":true,"issue_points":true,"redeem_points":true}'),
  ('Manager', 'manager', '{"can_access_dashboard":true,"manage_products":true,"manage_offers":true,"manage_customers":true,"view_stats":true,"issue_points":true,"redeem_points":true}'),
  ('Cashier', 'cashier', '{"can_access_dashboard":true,"manage_products":false,"manage_offers":false,"manage_customers":true,"view_stats":false,"issue_points":true,"redeem_points":true}'),
  ('Client',  'client',  '{"can_access_dashboard":false,"manage_products":false,"manage_offers":false,"manage_customers":false,"view_stats":false,"issue_points":false,"redeem_points":false}');

-- ─────────────────────────────────────────────
--  stores
-- ─────────────────────────────────────────────
CREATE TABLE public.stores (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email      TEXT        NOT NULL,
  owner_username   TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  slug             TEXT        UNIQUE NOT NULL,
  description      TEXT,
  logo_url         TEXT,
  phone            TEXT,
  address          TEXT,
  city             TEXT,
  category         TEXT,

  -- Loyalty configuration
  tier_config      JSONB       NOT NULL DEFAULT '{"bronze":0,"silver":10000,"gold":50000,"platinum":100000}',
  points_rate      INTEGER     NOT NULL DEFAULT 1,
  welcome_points   INTEGER     NOT NULL DEFAULT 100,
  primary_color    TEXT        NOT NULL DEFAULT '#D4AF37',
  plan             TEXT        NOT NULL DEFAULT 'basic',

  -- Advertising
  ad_points_balance INTEGER    NOT NULL DEFAULT 0,

  -- Telegram bot
  bot_token        TEXT,
  bot_username     TEXT,

  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  products
-- ─────────────────────────────────────────────
CREATE TABLE public.products (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id         UUID        NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  description      TEXT,
  price            INTEGER     NOT NULL,
  category         TEXT        NOT NULL DEFAULT 'عام',
  image_url        TEXT,
  is_exclusive     BOOLEAN     NOT NULL DEFAULT FALSE,
  min_tier_to_view TEXT        NOT NULL DEFAULT 'bronze'
                               CHECK (min_tier_to_view IN ('bronze','silver','gold','platinum')),
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  offers
-- ─────────────────────────────────────────────
CREATE TABLE public.offers (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id         UUID        NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  description      TEXT,
  type             TEXT        NOT NULL
                               CHECK (type IN ('discount','gift','double_points','flash','exclusive')),
  target_type      TEXT        NOT NULL DEFAULT 'all'
                               CHECK (target_type IN ('all','products')),
  discount_percent INTEGER,
  points_cost      INTEGER     NOT NULL DEFAULT 0,
  min_tier         TEXT        NOT NULL DEFAULT 'bronze'
                               CHECK (min_tier IN ('bronze','silver','gold','platinum')),
  occasion_type    TEXT        NOT NULL DEFAULT 'always'
                               CHECK (occasion_type IN ('always','fixed','birthday','anniversary','win_back','flash')),
  occasion_date    DATE,
  valid_from       TIMESTAMPTZ,
  valid_until      TIMESTAMPTZ,
  usage_limit      INTEGER,
  image_url        TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  offer_products  –  many-to-many join
-- ─────────────────────────────────────────────
CREATE TABLE public.offer_products (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id   UUID        NOT NULL REFERENCES public.offers   (id) ON DELETE CASCADE,
  product_id UUID        NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (offer_id, product_id)
);

-- ─────────────────────────────────────────────
--  user_store_memberships
-- ─────────────────────────────────────────────
CREATE TABLE public.user_store_memberships (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.users  (id) ON DELETE CASCADE,
  store_id      UUID        NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  role_id       UUID        REFERENCES public.roles (id) ON DELETE SET NULL,

  -- Loyalty state
  points        INTEGER     NOT NULL DEFAULT 0,
  tier          TEXT        NOT NULL DEFAULT 'bronze'
                            CHECK (tier IN ('bronze','silver','gold','platinum')),
  total_spent   INTEGER     NOT NULL DEFAULT 0,
  visit_count   INTEGER     NOT NULL DEFAULT 0,
  last_purchase TIMESTAMPTZ,

  -- Referral
  referral_code TEXT        UNIQUE DEFAULT SUBSTR(MD5(RANDOM()::TEXT), 1, 8),

  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, store_id)
);

-- ─────────────────────────────────────────────
--  transactions
--  user_id is nullable to support pending QR-code flows.
-- ─────────────────────────────────────────────
CREATE TABLE public.transactions (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id      UUID        NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
  user_id       UUID        REFERENCES public.users  (id) ON DELETE CASCADE,
  membership_id UUID        REFERENCES public.user_store_memberships (id) ON DELETE CASCADE,
  offer_id      UUID        REFERENCES public.offers (id) ON DELETE SET NULL,

  type          TEXT        NOT NULL
                            CHECK (type IN ('earn','redeem','adjust','expire','welcome')),
  points        INTEGER     NOT NULL,
  amount        INTEGER,
  note          TEXT,
  description   TEXT,

  -- QR-code fields
  qr_token      TEXT        UNIQUE,
  qr_used       BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at    TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  redemptions
-- ─────────────────────────────────────────────
CREATE TABLE public.redemptions (
  id                   <response clipped><NOTE>Result is longer than **10000 characters**, will be **truncated**.</NOTE>