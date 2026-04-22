-- ─────────────────────────────────────────────
--  seed-spa-wellness.sql
--  Seeds spa treatments and wellness data
-- ─────────────────────────────────────────────

DO $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the first store
  SELECT id INTO v_store_id FROM public.stores LIMIT 1;
  
  IF v_store_id IS NULL THEN
    RAISE NOTICE 'No store found, skipping seed';
    RETURN;
  END IF;

  -- ═══════════════════════════════════════
  --  SPA TREATMENTS (Products)
  -- ═══════════════════════════════
  
  INSERT INTO public.products (
    store_id, name, description, price, category, image_url,
    is_exclusive, min_tier_to_view, is_active,
    duration_minutes, benefits, skin_type_compatibility, aftercare_tips
  ) VALUES
  -- Facial Treatments
  (v_store_id, 'Hydra Facial', 'Deep cleansing and hydration facial treatment for glowing skin', 3500, 'Facial', 'https://images.unsplash.com/photo-1570172619640-3c0c4d5a2d1b?w=400',
   false, 'bronze', true, 60, ARRAY['Hydrating', 'Deep Cleansing', 'Brightening'], ARRAY['Dry', 'Normal', 'Combination'], 
   'Avoid direct sunlight and apply moisturizer regularly'),
   
  (v_store_id, 'Anti-Aging Facial', 'Premium treatment with collagenboosting formulas', 4500, 'Facial', 'https://images.unsplash.com/photo-1512291313931-d429904c7a4c?w=400',
   false, 'bronze', true, 75, ARRAY['Anti-Aging', 'Firming', 'Rejuvenating'], ARRAY['Dry', 'Normal', 'Sensitive'],
   'Avoid sun exposure for 24 hours, use SPF 30+'),
   
  (v_store_id, 'Oxygen Facial', 'Restore skins natural radiance with oxygen therapy', 4000, 'Facial', 'https://images.unsplash.com/photo-1522337660859-02fb71ba92cd?w=400',
   false, 'silver', true, 50, ARRAY['Brightening', 'Radiant Finish', 'Instant Glow'], ARRAY['Oily', 'Normal', 'Combination'],
   'No makeup for 12 hours after treatment'),
   
  (v_store_id, 'Gentle Oat Facial', 'Soothing treatment for sensitive skin types', 3000, 'Facial', 'https://images.unsplash.com/photo-1616394584738-fc6c612d8f87?w=400',
   false, 'bronze', true, 45, ARRAY['Soothing', 'Calming', 'Redness Reducing'], ARRAY['Sensitive'],
   'Use gentle, fragrance-free products for 48 hours'),

  -- Body Treatments
  (v_store_id, 'Full Body Massage', '60-minute relaxing full body massage', 5000, 'Body', 'https://images.unsplash.com/photo-1544161515-4d1e600f0902?w=400',
   false, 'bronze', true, 60, ARRAY['Relaxation', 'Stress Relief', 'Muscle Release'], ARRAY['Dry', 'Normal', 'Combination', 'Oily'],
   'Drink plenty of water, avoid heavy meals'),
   
  (v_store_id, 'Hot Stone Therapy', 'Deep tissue massage with heated stones', 6000, 'Body', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400',
   false, 'silver', true, 75, ARRAY['Deep Relaxation', 'Muscle Recovery', 'Detox'], ARRAY['Dry', 'Normal'],
   'Rest for the remainder of the day'),

  -- Specialized Treatments
  (v_store_id, 'Scalp & Hair Treatment', 'Revitalizing scalp massage with hair mask', 2500, 'Scalp', 'https://images.unsplash.com/photo-1580618672591-8521801b1a98?w=400',
   false, 'bronze', true, 30, ARRAY['Scalp Health', 'Hair Growth', 'Relaxation'], ARRAY['Dry', 'Oily', 'Normal'],
   'Avoid washing hair for 24 hours'),
   
  (v_store_id, 'Eye Delight Treatment', 'Targeted care for delicate eye area', 2000, 'Face', 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400',
   false, 'bronze', true, 25, ARRAY['Dark Circle Reduction', 'Puffiness', 'Fine Lines'], ARRAY['Dry', 'Normal', 'Sensitive'],
   'Avoid eye makeup for 24 hours'),

  -- Premium/VIP Treatments
  (v_store_id, 'Zen Master Ritual', 'Full day wellness journey - exclusive', 12000, 'Premium', 'https://images.unsplash.com/photo-1540555700478-4be289fbec03?w=400',
   true, 'gold', true, 120, ARRAY['Complete Wellness', 'Full Body', 'Luxury'], ARRAY['Dry', 'Normal', 'Combination'],
   'Full day rest recommended, complementary follow-up included'),
   
  (v_store_id, 'Diamond Glow Package', 'Ultimate pampering experience', 15000, 'Premium', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400',
   true, 'platinum', true, 90, ARRAY['Radiance', 'Luxury', 'All-Inclusive'], ARRAY['Dry', 'Normal', 'Combination', 'Oily'],
   'Enjoy the afterglow! Take-home kit included')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════
  --  WELLNESS RITUALS (Offers)
  -- ═══════════════════════════════════════
  
  INSERT INTO public.offers (
    store_id, title, description, type, target_type, discount_percent,
    points_cost, min_tier, occasion_type, valid_from, valid_until,
    image_url, is_active
  ) VALUES
  (v_store_id, 'New Member Ritual', 'Welcome to the wellness community!', 'discount', 'all', 15,
   0, 'bronze', 'always', NOW(), NOW() + INTERVAL '90 days',
   'https://images.unsplash.com/photo-1552693323-8f3a10a28c4e?w=400', true),
   
  (v_store_id, 'Morning Glow Special', 'Book before noon for bonus', 'discount', 'all', 10,
   0, 'bronze', 'always', NOW(), NOW() + INTERVAL '90 days',
   'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', true),
   
  (v_store_id, 'Refer-a-Friend Ritual', 'Share wellness with friends', 'gift', 'all', NULL,
   500, 'bronze', 'always', NOW(), NOW() + INTERVAL '1 year',
   'https://images.unsplash.com/photo-1527515637462-cff24759b091?w=400', true),
   
  (v_store_id, 'Birthday Luxe Treatment', 'Your special day deserves extra care', 'discount', 'all', 25,
   0, 'bronze', 'birthday', NOW(), NOW() + INTERVAL '1 year',
   'https://images.unsplash.com/photo-1519626335236-335454f12386?w=400', true)
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════
  --  SCRATCH CARDS (Wellness Rewards)
  -- ═══════════════════════════════════════
  
  INSERT INTO public.scratch_cards (
    store_id, title, description, reward_type, reward_value,
    trigger_type, surface_color, status
  ) VALUES
  (v_store_id, 'Free Eye Treatment', 'Claim your complimentary eye delight!', 'points', 500,
   'manual', '#8A9A8A', 'active'),
   
  (v_store_id, '15 Min Scalp Massage', 'Add-on to any treatment', 'gift', 0,
   'manual', '#B19CD9', 'active'),
   
  (v_store_id, '20% Off Next Visit', 'Book again soon!', 'discount', 20,
   'manual', '#D4AF37', 'active'),
   
  (v_store_id, 'Double Points', 'Earn double on your next visit', 'double_points', 2,
   'manual', '#F7CAC9', 'active')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════
  --  GIVE WELCOME SCRATCH CARDS TO MEMBERS
  -- ═══════════════════════════════════════
  
  FOR v_user_id IN (SELECT user_id FROM public.user_store_memberships WHERE store_id = v_store_id) LOOP
    -- Give first scratch card to new members
    INSERT INTO public.scratch_card_claims (card_id, user_id, store_id, is_revealed)
    SELECT id, v_user_id, v_store_id, false
    FROM public.scratch_cards
    WHERE store_id = v_store_id AND status = 'active'
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Spa wellness data seeded successfully!';
END $$;