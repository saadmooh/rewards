-- ─────────────────────────────────────────────
--  seed-scratch-cards.sql
--  Populates scratch_cards and claims for existing stores and users
-- ─────────────────────────────────────────────

DO $$
DECLARE
  v_store_id UUID;
  v_user_id  UUID;
  v_card_id  UUID;
BEGIN
  -- Iterate through each store
  FOR v_store_id IN SELECT id FROM public.stores LOOP
    
    -- 1. Create a "Welcome Bonus" Scratch Card
    INSERT INTO public.scratch_cards (
      store_id, title, description, reward_type, reward_value, trigger_type, surface_color, status
    ) VALUES (
      v_store_id, 'Welcome Surprise!', 'Scratch for a gift as a new member', 'points', 250, 'welcome', '#4F46E5', 'active'
    ) RETURNING id INTO v_card_id;

    -- 2. Create a "Birthday Gift" Scratch Card
    INSERT INTO public.scratch_cards (
      store_id, title, description, reward_type, reward_value, trigger_type, surface_color, status
    ) VALUES (
      v_store_id, 'Birthday Magic!', 'Happy Birthday! Scratch for a special reward', 'double_points', 2, 'birthday', '#EC4899', 'active'
    );

    -- 3. Create a "Tier Upgrade" Scratch Card
    INSERT INTO public.scratch_cards (
      store_id, title, description, reward_type, reward_value, trigger_type, surface_color, status
    ) VALUES (
      v_store_id, 'Level Up Reward!', 'Congratulations on your new tier!', 'discount', 15, 'tier_upgrade', '#F59E0B', 'active'
    );

    -- 4. Create a "Manual/Special" Scratch Card
    INSERT INTO public.scratch_cards (
      store_id, title, description, reward_type, reward_value, trigger_type, surface_color, status
    ) VALUES (
      v_store_id, 'Mystery Prize', 'Limited time mystery reward', 'points', 500, 'manual', '#10B981', 'active'
    ) RETURNING id INTO v_card_id;

    -- 5. Give 2 unrevealed claims to each member of this store to test the Home UI
    FOR v_user_id IN (SELECT user_id FROM public.user_store_memberships WHERE store_id = v_store_id) LOOP
      -- Claim 1 (Welcome)
      INSERT INTO public.scratch_card_claims (card_id, user_id, store_id, is_revealed)
      SELECT id, v_user_id, v_store_id, false 
      FROM public.scratch_cards 
      WHERE store_id = v_store_id AND trigger_type = 'welcome' 
      LIMIT 1;

      -- Claim 2 (Mystery)
      INSERT INTO public.scratch_card_claims (card_id, user_id, store_id, is_revealed)
      SELECT id, v_user_id, v_store_id, false 
      FROM public.scratch_cards 
      WHERE store_id = v_store_id AND trigger_type = 'manual' 
      LIMIT 1;
    END LOOP;

  END LOOP;
END $$;
