-- ═══════════════════════════════════════════════════════════════
--  COMBINED SPA PIVOT MIGRATION
--  Run this entire file in Supabase SQL Editor at once
-- ═══════════════════════════════════════════════════════════════

-- 1. ADD SPA FIELDS TO PRODUCTS
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS skin_type_compatibility TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS aftercare_tips TEXT;

-- 2. ADD SKIN FIELDS TO USERS
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS skin_type TEXT,
ADD COLUMN IF NOT EXISTS skin_concerns TEXT[] DEFAULT '{}';

-- 3. CREATE BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
DROP POLICY IF EXISTS "Anyone can view bookings for demo" ON public.bookings;
CREATE POLICY "Anyone can view bookings for demo" ON public.bookings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Anyone can insert bookings for demo" ON public.bookings;
CREATE POLICY "Anyone can insert bookings for demo" ON public.bookings FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update bookings for demo" ON public.bookings;
CREATE POLICY "Anyone can update bookings for demo" ON public.bookings FOR UPDATE TO public USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_store ON public.bookings(store_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 4. SEED SPA TREATMENTS (Using subqueries to find store_id safely)

-- Seeding Products
INSERT INTO public.products (
  store_id, name, description, price, category, image_url,
  is_exclusive, min_tier_to_view, is_active,
  duration_minutes, benefits, skin_type_compatibility, aftercare_tips
)
SELECT 
  s.id, t.name, t.description, t.price, t.category, t.image_url,
  t.is_exclusive, t.min_tier_to_view, t.is_active,
  t.duration_minutes, t.benefits, t.skin_type_compatibility, t.aftercare_tips
FROM (
  VALUES 
    ('Hydra Facial', 'Deep cleansing and hydration facial for glowing skin', 3500, 'Facial', 'https://images.unsplash.com/photo-1570172619640-3c0c4d5a2d1b?w=400', false, 'bronze', true, 60, ARRAY['Hydrating', 'Deep Cleansing', 'Brightening'], ARRAY['Dry', 'Normal', 'Combination'], 'Avoid direct sunlight and apply moisturizer regularly'),
    ('Anti-Aging Facial', 'Premium collagen-boosting treatment', 4500, 'Facial', 'https://images.unsplash.com/photo-1512291313931-d429904c7a4c?w=400', false, 'bronze', true, 75, ARRAY['Anti-Aging', 'Firming', 'Rejuvenating'], ARRAY['Dry', 'Normal', 'Sensitive'], 'Avoid sun exposure for 24 hours'),
    ('Full Body Massage', '60-minute relaxing full body massage', 5000, 'Body', 'https://images.unsplash.com/photo-1544161515-4d1e600f0902?w=400', false, 'bronze', true, 60, ARRAY['Relaxation', 'Stress Relief', 'Muscle Release'], ARRAY['Dry', 'Normal', 'Combination', 'Oily'], 'Drink plenty of water'),
    ('Hot Stone Therapy', 'Deep tissue with heated stones', 6000, 'Body', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400', false, 'silver', true, 75, ARRAY['Deep Relaxation', 'Muscle Recovery'], ARRAY['Dry', 'Normal'], 'Rest for the remainder of the day'),
    ('Gentle Oat Facial', 'Soothing for sensitive skin', 3000, 'Facial', 'https://images.unsplash.com/photo-1616394584738-fc6c612d8f87?w=400', false, 'bronze', true, 45, ARRAY['Soothing', 'Calming'], ARRAY['Sensitive'], 'Use gentle products for 48 hours')
) AS t(name, description, price, category, image_url, is_exclusive, min_tier_to_view, is_active, duration_minutes, benefits, skin_type_compatibility, aftercare_tips)
CROSS JOIN (SELECT id FROM public.stores LIMIT 1) AS s
ON CONFLICT DO NOTHING;

-- Seeding Offers
INSERT INTO public.offers (
  store_id, title, description, type, target_type, discount_percent,
  points_cost, min_tier, occasion_type, valid_from, valid_until, is_active
)
SELECT 
  s.id, t.title, t.description, t.type, t.target_type, t.discount_percent,
  t.points_cost, t.min_tier, t.occasion_type, t.valid_from, t.valid_until, t.is_active
FROM (
  VALUES 
    ('New Member Ritual', 'Welcome offer!', 'discount', 'all', 15, 0, 'bronze', 'always', NOW(), NOW() + INTERVAL '90 days', true),
    ('Refer-a-Friend Ritual', 'Share wellness with friends', 'gift', 'all', NULL, 500, 'bronze', 'always', NOW(), NOW() + INTERVAL '1 year', true)
) AS t(title, description, type, target_type, discount_percent, points_cost, min_tier, occasion_type, valid_from, valid_until, is_active)
CROSS JOIN (SELECT id FROM public.stores LIMIT 1) AS s
ON CONFLICT DO NOTHING;

-- Seeding Scratch Cards
INSERT INTO public.scratch_cards (
  store_id, title, description, reward_type, reward_value, trigger_type, surface_color, status
)
SELECT 
  s.id, t.title, t.description, t.reward_type, t.reward_value, t.trigger_type, t.surface_color, t.status
FROM (
  VALUES 
    ('Free Eye Treatment', 'Complimentary eye delight!', 'points', 500, 'manual', '#8A9A8A', 'active'),
    ('15 Min Scalp Massage', 'Add-on to any treatment', 'gift', 0, 'manual', '#B19CD9', 'active'),
    ('20% Off Next Visit', 'Book again soon!', 'discount', 20, 'manual', '#D4AF37', 'active')
) AS t(title, description, reward_type, reward_value, trigger_type, surface_color, status)
CROSS JOIN (SELECT id FROM public.stores LIMIT 1) AS s
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON COLUMN public.products.duration_minutes IS 'Treatment duration in minutes';
COMMENT ON COLUMN public.products.benefits IS 'Array of treatment benefits';
COMMENT ON COLUMN public.products.skin_type_compatibility IS 'Array of compatible skin types';
COMMENT ON COLUMN public.products.aftercare_tips IS 'Aftercare instructions';
COMMENT ON COLUMN public.users.skin_type IS 'User skin type for personalization';
COMMENT ON COLUMN public.users.skin_concerns IS 'User skin concerns';
COMMENT ON TABLE public.bookings IS 'Spa treatment appointments';
