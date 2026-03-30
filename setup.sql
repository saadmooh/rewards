-- Supabase Schema for Rewards Dashboard
-- Authentication and Users extension
create extension if not exists "uuid-ossp";

-- Drop existing tables (in order to handle foreign key dependencies)
DROP TABLE IF EXISTS ad_impressions CASCADE;
DROP TABLE IF EXISTS user_behavior_tags CASCADE;
DROP TABLE IF EXISTS cross_promotions CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_store_memberships CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (identified by telegram_id, no auth.users dependency)
create table public.users (
  id uuid default gen_random_uuid() primary key,
  full_name text,
  username text unique,
  telegram_id bigint unique,
  language_code text,
  avatar_url text,
  photo_url text,
  phone text,
  birth_date date,
  gender text check (gender in ('male', 'female')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  role text default 'user' check (role in ('user', 'admin', 'super_admin')),
  is_super_admin boolean default false,
  is_bot boolean default false,
  is_premium boolean default false,
  last_active timestamptz,
  permissions text[] default array['read']::text[],
  ad_points_balance integer default 0
);

-- Stores table
create table public.stores (
  id uuid default uuid_generate_v4() primary key,
  owner_email text not null,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  phone text,
  address text,
  city text,
  category text,
  tier_config jsonb default '{"bronze": 0, "silver": 10000, "gold": 50000, "platinum": 100000}'::jsonb,
  points_rate integer default 1,
  welcome_points integer default 100,
  primary_color text default '#D4AF37',
  plan text default 'basic',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_active boolean default true,
  ad_points_balance integer default 0
);

-- Products table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  description text,
  price integer not null,
  category text default 'عام',
  image_url text,
  is_exclusive boolean default false,
  min_tier_to_view text default 'bronze' check (min_tier_to_view in ('bronze', 'silver', 'gold', 'platinum')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Offers table
create table public.offers (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  title text not null,
  description text,
  type text not null check (type in ('discount', 'gift', 'double_points', 'flash', 'exclusive')),
  discount_percent integer,
  points_cost integer default 0,
  min_tier text default 'bronze' check (min_tier in ('bronze', 'silver', 'gold', 'platinum')),
  occasion_type text default 'always' check (occasion_type in ('always', 'fixed', 'birthday', 'anniversary', 'win_back', 'flash')),
  occasion_date date,
  valid_from timestamptz,
  valid_until timestamptz,
  usage_limit integer,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User-Store Memberships table
create table public.user_store_memberships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete cascade not null,
  role text default 'viewer' check (role in ('owner', 'manager', 'cashier', 'viewer')),
  permissions jsonb default '{"view": true}'::jsonb,
  points integer default 0,
  tier text default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  total_spent integer default 0,
  visit_count integer default 0,
  last_purchase timestamptz,
  joined_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, store_id)
);

-- Transactions table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete cascade not null,
  type text not null check (type in ('earn', 'redeem', 'adjust', 'expire')),
  points integer not null,
  amount integer,
  description text,
  created_at timestamptz default now()
);

-- Redemptions table
create table public.redemptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete cascade not null,
  offer_id uuid references public.offers(id) on delete cascade not null,
  points_spent integer not null,
  discount_applied integer,
  created_at timestamptz default now()
);

-- Promotions/Advertising Campaigns table
create table public.promotions (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  title text not null,
  body text,
  image_url text,
  cta_label text default 'اكتشف المتجر',
  cta_url text,
  target_tiers text[] default array['bronze', 'silver', 'gold', 'platinum'],
  target_gender text check (target_gender in ('male', 'female', null)),
  target_city text,
  target_min_spent integer,
  reward_points integer default 50,
  budget_points integer default 1000,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

-- Row Level Security Policies
alter table public.users enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.offers enable row level security;
alter table public.user_store_memberships enable row level security;
alter table public.transactions enable row level security;
alter table public.redemptions enable row level security;
alter table public.promotions enable row level security;

-- Users policies - allow anonymous access for telegram-based auth
create policy "Allow anon select users" on public.users for select using (true);
create policy "Allow anon insert users" on public.users for insert with check (true);
create policy "Allow anon update users" on public.users for update using (true);

-- Stores policies - allow anonymous select, insert
create policy "Allow anon select stores" on public.stores for select using (true);
create policy "Allow anon insert stores" on public.stores for insert with check (true);
create policy "Allow anon update stores" on public.stores for update using (true);
create policy "Super admins can manage all stores" on public.stores
  for all using ( exists (
    select 1 from public.users 
    where users.id = auth.uid() and users.is_super_admin = true
  ));
create policy "Store owners can manage their stores" on public.stores
  for all using (auth.jwt()->>'email' = owner_email);

-- Products policies - allow anonymous access
create policy "Allow anon select products" on public.products for select using (true);
create policy "Allow anon insert products" on public.products for insert with check (true);
create policy "Allow anon update products" on public.products for update using (true);
create policy "Super admins can manage products" on public.products
  for all using ( exists (
    select 1 from public.users 
    where users.id = auth.uid() and users.is_super_admin = true
  ));
create policy "Store owners can manage products" on public.products
  for all using (exists (
    select 1 from public.stores where id = products.store_id and owner_email = auth.jwt()->>'email'
  ));

-- Offers policies - allow anonymous access
create policy "Allow anon select offers" on public.offers for select using (true);
create policy "Allow anon insert offers" on public.offers for insert with check (true);
create policy "Allow anon update offers" on public.offers for update using (true);
create policy "Super admins can manage offers" on public.offers
  for all using ( exists (
    select 1 from public.users 
    where users.id = auth.uid() and users.is_super_admin = true
  ));
create policy "Store owners can manage offers" on public.offers
  for all using (exists (
    select 1 from public.stores where id = offers.store_id and owner_email = auth.jwt()->>'email'
  ));

-- User store memberships policies - allow anonymous access
create policy "Allow anon select memberships" on public.user_store_memberships for select using (true);
create policy "Allow anon insert memberships" on public.user_store_memberships for insert with check (true);
create policy "Allow anon update memberships" on public.user_store_memberships for update using (true);

-- Transactions policies - allow anonymous access
create policy "Allow anon select transactions" on public.transactions for select using (true);
create policy "Allow anon insert transactions" on public.transactions for insert with check (true);

-- Redemptions policies
create policy "Allow anon select redemptions" on public.redemptions for select using (true);
create policy "Allow anon insert redemptions" on public.redemptions for insert with check (true);

-- Promotions policies - allow anonymous access
create policy "Allow anon select promotions" on public.promotions for select using (true);
create policy "Allow anon insert promotions" on public.promotions for insert with check (true);
create policy "Allow anon update promotions" on public.promotions for update using (true);
create policy "Super admins can manage promotions" on public.promotions
  for all using ( exists (
    select 1 from public.users 
    where users.id = auth.uid() and users.is_super_admin = true
  ));
create policy "Store owners can manage promotions" on public.promotions
  for all using (exists (
    select 1 from public.stores where id = promotions.store_id and owner_email = auth.jwt()->>'email'
  ));

-- Indexes
create index idx_products_store_id on public.products(store_id);
create index idx_offers_store_id on public.offers(store_id);
create index idx_user_store_memberships_store_id on public.user_store_memberships(store_id);
create index idx_user_store_memberships_tier on public.user_store_memberships(tier);
create index idx_transactions_store_id on public.transactions(store_id);
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_redemptions_store_id on public.redemptions(store_id);
create index idx_redemptions_offer_id on public.redemptions(offer_id);
create index idx_promotions_store_id on public.promotions(store_id);

-- Function to update tier based on points
create or replace function public.update_user_tier()
returns trigger as $$
begin
  declare
    tier_config jsonb;
    current_points integer;
    new_tier text;
  begin
    select s.tier_config, new.points into tier_config, current_points
    from public.stores s
    join public.user_store_memberships new on new.store_id = s.id
    where new.id = tg.id;

    if current_points >= (tier_config->>'platinum')::integer then
      new_tier := 'platinum';
    elsif current_points >= (tier_config->>'gold')::integer then
      new_tier := 'gold';
    elsif current_points >= (tier_config->>'silver')::integer then
      new_tier := 'silver';
    else
      new_tier := 'bronze';
    end if;

    if new_tier <> old.tier then
      update public.user_store_memberships set tier = new_tier, updated_at = now() where id = tg.id;
    end if;

    return new;
  end;
end;
$$ language plpgsql;

-- Trigger for automatic tier updates
DROP TRIGGER IF EXISTS update_tier_trigger ON public.user_store_memberships;
CREATE TRIGGER update_tier_trigger
  AFTER UPDATE OF points ON public.user_store_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_user_tier();

-- Function to handle new user creation
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, username, telegram_id)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    (new.raw_user_meta_data->>'telegram_id')::bigint
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- MIGRATION: Add missing columns to existing databases
-- Run these commands if you already have tables created
-- ============================================================

DO $$
BEGIN
  -- Add language_code to users if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'language_code'
  ) THEN
    ALTER TABLE public.users ADD COLUMN language_code text;
  END IF;

  -- Add avatar_url to users if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url text;
  END IF;

  -- Add photo_url to users if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN photo_url text;
  END IF;

  -- Add last_active to users if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_active'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_active timestamptz;
  END IF;

  -- Add is_bot to users if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_bot'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_bot boolean DEFAULT false;
  END IF;

  -- Add is_premium to users if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_premium boolean DEFAULT false;
  END IF;

  -- Add role to user_store_memberships if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_store_memberships' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.user_store_memberships ADD COLUMN role text DEFAULT 'viewer';
  END IF;

  -- Add permissions to user_store_memberships if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_store_memberships' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE public.user_store_memberships ADD COLUMN permissions jsonb DEFAULT '{"view": true}';
  END IF;

  -- Add missing columns to stores if not exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'points_rate'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN points_rate integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'welcome_points'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN welcome_points integer DEFAULT 100;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'primary_color'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN primary_color text DEFAULT '#D4AF37';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'plan'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN plan text DEFAULT 'basic';
  END IF;
END $$;

-- Seed super admin user and demo store (matching actual database schema)
INSERT INTO public.users (id, telegram_id, username, full_name, photo_url, language_code, is_super_admin, role, created_at, updated_at)
VALUES ('b7849646-d726-4ece-ab01-f6180d99f8bd', 1203654887, 'SaadMohammedMansour', 'ساعد محمد', 'https://t.me/i/userpic/320/vaEmCb4JhMM_i58csiaO0WR_j7EmajVRj1lcKxuUrWs.svg', 'ar', true, 'super_admin', now(), now())
ON CONFLICT (telegram_id) DO UPDATE SET is_super_admin = true;

INSERT INTO public.stores (id, slug, name, owner_email, category, points_rate, welcome_points, primary_color, plan, is_active, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'store-alpha', 'متجر التجميع', 'saad@example.com', 'متجر عام', 1, 100, '#D4AF37', 'basic', true, now(), now())
ON CONFLICT (slug) DO NOTHING;

-- Add super admin to the store as owner
INSERT INTO public.user_store_memberships (user_id, store_id, role, points, tier, joined_at)
VALUES ('b7849646-d726-4ece-ab01-f6180d99f8bd', '11111111-1111-1111-1111-111111111111', 'owner', 0, 'bronze', now())
ON CONFLICT (user_id, store_id) DO NOTHING;

-- Products for store-alpha
INSERT INTO public.products (store_id, name, description, price, category, is_active, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Premium Coffee Maker', 'State-of-the-art coffee machine', 299, 'appliances', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'Wireless Earbuds Pro', 'High-quality audio', 199, 'electronics', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'Yoga Mat Premium', 'Eco-friendly yoga mat', 49, 'fitness', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'Smart Watch Series X', 'Advanced tracking features', 349, 'electronics', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'Designer Handbag', 'Elegant leather handbag', 179, 'fashion', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'Blender Set Professional', 'High-performance blender', 129, 'appliances', true, now())
ON CONFLICT DO NOTHING;

-- Offers for store-alpha
INSERT INTO public.offers (store_id, title, description, type, discount_percent, points_cost, min_tier, valid_until, is_active, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '30% Off Shirts', 'Valid on all shirts', 'discount', 30, 500, 'bronze', '2026-12-31', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'Double Points', 'Earn 2x points on all purchases', 'double_points', null, 0, 'bronze', '2026-12-31', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'Free Gift', 'Free gift with purchase over 5000 points', 'gift', null, 300, 'silver', '2026-12-31', true, now())
ON CONFLICT DO NOTHING;
