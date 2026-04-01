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
DROP TABLE IF EXISTS offer_products CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_store_memberships CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
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
  ad_points_balance integer default 0,
  allows_write_to_pm boolean default false,
  added_to_attachment_menu boolean default false,
  phone_number text,
  raw_telegram_data jsonb
);

-- Roles table for granular permissions
create table public.roles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  permissions jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Insert default roles
INSERT INTO public.roles (name, slug, permissions) VALUES 
  ('Owner', 'owner', '{"can_access_dashboard": true, "manage_products": true, "manage_offers": true, "manage_customers": true, "view_stats": true, "issue_points": true, "redeem_points": true}'),
  ('Manager', 'manager', '{"can_access_dashboard": true, "manage_products": true, "manage_offers": true, "manage_customers": true, "view_stats": true, "issue_points": true, "redeem_points": true}'),
  ('Cashier', 'cashier', '{"can_access_dashboard": true, "manage_products": false, "manage_offers": false, "manage_customers": true, "view_stats": false, "issue_points": true, "redeem_points": true}'),
  ('Client', 'client', '{"can_access_dashboard": false, "manage_products": false, "manage_offers": false, "manage_customers": false, "view_stats": false, "issue_points": false, "redeem_points": false}');

-- Stores table
create table public.stores (
  id uuid default uuid_generate_v4() primary key,
  owner_email text not null,
  owner_username text not null,
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
  ad_points_balance integer default 0,
  bot_token text,
  bot_username text
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
  target_type text default 'all' check (target_type in ('all', 'products')),
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

-- Offer-Products linking table
create table public.offer_products (
  id uuid default gen_random_uuid() primary key,
  offer_id uuid references public.offers(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(offer_id, product_id)
);

-- User-Store Memberships table
create table public.user_store_memberships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  store_id uuid references public.stores(id) on delete cascade not null,
  role_id uuid references public.roles(id) on delete set null,
  points integer default 0,
  tier text default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  total_spent integer default 0,
  visit_count integer default 0,
  last_purchase timestamptz,
  joined_at timestamptz default now(),
  updated_at timestamptz default now(),
  referral_code text unique default substr(md5(random()::text), 1, 8),
  unique(user_id, store_id)
);

-- Transactions table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade, -- Nullable for pending QR codes
  store_id uuid references public.stores(id) on delete cascade not null,
  membership_id uuid references public.user_store_memberships(id) on delete cascade,
  type text not null check (type in ('earn', 'redeem', 'adjust', 'expire', 'welcome')),
  points integer not null,
  amount integer,
  note text,
  offer_id uuid references public.offers(id) on delete set null,
  description text,
  qr_token text unique,
  qr_used boolean default false,
  expires_at timestamptz,
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
DROP TABLE IF EXISTS storage.buckets CASCADE;
DROP TABLE IF EXISTS storage.objects CASCADE;
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

-- Storage policies
drop policy if exists "Allow public read product-images" on storage.objects;
drop policy if exists "Allow public insert product-images" on storage.objects;
drop policy if exists "Allow public update product-images" on storage.objects;
drop policy if exists "Allow public delete product-images" on storage.objects;
create policy "Allow public read product-images" on storage.objects for select using ( bucket_id = 'product-images' );
create policy "Allow public insert product-images" on storage.objects for insert with check ( bucket_id = 'product-images' );
create policy "Allow public update product-images" on storage.objects for update using ( bucket_id = 'product-images' );
create policy "Allow public delete product-images" on storage.objects for delete using ( bucket_id = 'product-images' );

-- Row Level Security Policies
alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.offers enable row level security;
alter table public.offer_products enable row level security;
alter table public.user_store_memberships enable row level security;
alter table public.transactions enable row level security;
alter table public.redemptions enable row level security;
alter table public.promotions enable row level security;

-- Roles policies
drop policy if exists "Allow public select roles" on public.roles;
drop policy if exists "Allow public insert roles" on public.roles;
drop policy if exists "Allow public update roles" on public.roles;
drop policy if exists "Allow public delete roles" on public.roles;
create policy "Allow public select roles" on public.roles for select using (true);
create policy "Allow public insert roles" on public.roles for insert with check (true);
create policy "Allow public update roles" on public.roles for update using (true);
create policy "Allow public delete roles" on public.roles for delete using (true);

-- Users policies
drop policy if exists "Allow public select users" on public.users;
drop policy if exists "Allow public insert users" on public.users;
drop policy if exists "Allow public update users" on public.users;
drop policy if exists "Allow public delete users" on public.users;
create policy "Allow public select users" on public.users for select using (true);
create policy "Allow public insert users" on public.users for insert with check (true);
create policy "Allow public update users" on public.users for update using (true);
create policy "Allow public delete users" on public.users for delete using (true);

-- Stores policies
drop policy if exists "Allow public select stores" on public.stores;
drop policy if exists "Allow public insert stores" on public.stores;
drop policy if exists "Allow public update stores" on public.stores;
drop policy if exists "Allow public delete stores" on public.stores;
create policy "Allow public select stores" on public.stores for select using (true);
create policy "Allow public insert stores" on public.stores for insert with check (true);
create policy "Allow public update stores" on public.stores for update using (true);
create policy "Allow public delete stores" on public.stores for delete using (true);

-- Products policies
drop policy if exists "Allow public select products" on public.products;
drop policy if exists "Allow public insert products" on public.products;
drop policy if exists "Allow public update products" on public.products;
drop policy if exists "Allow public delete products" on public.products;
create policy "Allow public select products" on public.products for select using (true);
create policy "Allow public insert products" on public.products for insert with check (true);
create policy "Allow public update products" on public.products for update using (true);
create policy "Allow public delete products" on public.products for delete using (true);

-- Offers policies
drop policy if exists "Allow public select offers" on public.offers;
drop policy if exists "Allow public insert offers" on public.offers;
drop policy if exists "Allow public update offers" on public.offers;
drop policy if exists "Allow public delete offers" on public.offers;
create policy "Allow public select offers" on public.offers for select using (true);
create policy "Allow public insert offers" on public.offers for insert with check (true);
create policy "Allow public update offers" on public.offers for update using (true);
create policy "Allow public delete offers" on public.offers for delete using (true);

-- Offer products policies
drop policy if exists "Allow public select offer_products" on public.offer_products;
drop policy if exists "Allow public insert offer_products" on public.offer_products;
drop policy if exists "Allow public update offer_products" on public.offer_products;
drop policy if exists "Allow public delete offer_products" on public.offer_products;
create policy "Allow public select offer_products" on public.offer_products for select using (true);
create policy "Allow public insert offer_products" on public.offer_products for insert with check (true);
create policy "Allow public update offer_products" on public.offer_products for update using (true);
create policy "Allow public delete offer_products" on public.offer_products for delete using (true);

-- User store memberships policies
drop policy if exists "Allow public select memberships" on public.user_store_memberships;
drop policy if exists "Allow public insert memberships" on public.user_store_memberships;
drop policy if exists "Allow public update memberships" on public.user_store_memberships;
drop policy if exists "Allow public delete memberships" on public.user_store_memberships;
create policy "Allow public select memberships" on public.user_store_memberships for select using (true);
create policy "Allow public insert memberships" on public.user_store_memberships for insert with check (true);
create policy "Allow public update memberships" on public.user_store_memberships for update using (true);
create policy "Allow public delete memberships" on public.user_store_memberships for delete using (true);

-- Transactions policies
drop policy if exists "Allow public select transactions" on public.transactions;
drop policy if exists "Allow public insert transactions" on public.transactions;
drop policy if exists "Allow public update transactions" on public.transactions;
drop policy if exists "Allow public delete transactions" on public.transactions;
create policy "Allow public select transactions" on public.transactions for select using (true);
create policy "Allow public insert transactions" on public.transactions for insert with check (true);
create policy "Allow public update transactions" on public.transactions for update using (true);
create policy "Allow public delete transactions" on public.transactions for delete using (true);

-- Redemptions policies
drop policy if exists "Allow public select redemptions" on public.redemptions;
drop policy if exists "Allow public insert redemptions" on public.redemptions;
drop policy if exists "Allow public update redemptions" on public.redemptions;
drop policy if exists "Allow public delete redemptions" on public.redemptions;
create policy "Allow public select redemptions" on public.redemptions for select using (true);
create policy "Allow public insert redemptions" on public.redemptions for insert with check (true);
create policy "Allow public update redemptions" on public.redemptions for update using (true);
create policy "Allow public delete redemptions" on public.redemptions for delete using (true);

-- Promotions policies
drop policy if exists "Allow public select promotions" on public.promotions;
drop policy if exists "Allow public insert promotions" on public.promotions;
drop policy if exists "Allow public update promotions" on public.promotions;
drop policy if exists "Allow public delete promotions" on public.promotions;
create policy "Allow public select promotions" on public.promotions for select using (true);
create policy "Allow public insert promotions" on public.promotions for insert with check (true);
create policy "Allow public update promotions" on public.promotions for update using (true);
create policy "Allow public delete promotions" on public.promotions for delete using (true);

-- Indexes
create index idx_products_store_id on public.products(store_id);
create index idx_offers_store_id on public.offers(store_id);
create index idx_user_store_memberships_store_id on public.user_store_memberships(store_id);
create index idx_user_store_memberships_user_id on public.user_store_memberships(user_id);
create index idx_transactions_store_id on public.transactions(store_id);
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_offer_products_offer_id on public.offer_products(offer_id);
create index idx_offer_products_product_id on public.offer_products(product_id);

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
    where s.id = new.store_id;

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
      update public.user_store_memberships set tier = new_tier, updated_at = now() where id = new.id;
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
enha