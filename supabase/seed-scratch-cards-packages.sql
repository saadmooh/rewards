-- ─────────────────────────────────────────────
--  seed-scratch-cards-with-packages.sql
--  Populates scratch_cards with offer package rewards
-- ─────────────────────────────────────────────

DO $$
DECLARE
  v_store_id    UUID;
  v_user_id     UUID;
  v_package_id  UUID;
  v_card_id     UUID;
BEGIN
  -- Iterate through each store
  FOR v_store_id IN SELECT id FROM public.stores LOOP
    
    -- 1. Create a "Mega Bundle" Offer Package for this store
    INSERT INTO public.offer_packages (
      store_id, title, description, icon, reward_type, reward_value, reward_items, min_wait_hours, status
    ) VALUES (
      v_store_id, 
      'Elite Rewards Bundle', 
      'Contains exclusive discounts and a massive points boost!', 
      '💎', 
      'mixed', 
      1000, 
      '{"offers": ["20% OFF Everything", "Free Delivery"], "points": 1000}'::JSONB, 
      0, 
      'active'
    ) RETURNING id INTO v_package_id;

    -- 2. Create a "Surprise Gift" Offer Package
    INSERT INTO public.offer_packages (
      store_id, title, description, icon, reward_type, reward_value, status
    ) VALUES (
      v_store_id, 
      'Summer Gift Box', 
      'A collection of summer essentials just for you!', 
      '☀️', 
      'gift', 
      0, 
      'active'
    );

    -- 3. Create a Scratch Card that rewards the "Elite Rewards Bundle"
    INSERT INTO public.scratch_cards (
      store_id, 
      title, 
      description, 
      reward_type, 
      reward_value, 
      package_id, 
      trigger_type, 
      surface_color, 
      status
    ) VALUES (
      v_store_id, 
      'Win a Mega Bundle!', 
      'Scratch for a chance to win our Elite Rewards Bundle!', 
      'package', 
      0, 
      v_package_id, 
      'manual', 
      '#6366F1', 
      'active'
    ) RETURNING id INTO v_card_id;

    -- 4. Give an unrevealed claim for this package card to each member of this store
    FOR v_user_id IN (SELECT user_id FROM public.user_store_memberships WHERE store_id = v_store_id) LOOP
      INSERT INTO public.scratch_card_claims (card_id, user_id, store_id, is_revealed)
      VALUES (v_card_id, v_user_id, v_store_id, false)
      ON CONFLICT DO NOTHING;
    END LOOP;

  END LOOP;
END $$;
