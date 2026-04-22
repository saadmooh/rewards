-- Migration: Seed scratch cards
-- Description: Populates scratch_cards and claims for existing stores and users

DO $$
DECLARE
  v_store_id UUID;
  v_user_id  UUID;
  v_card_id  UUID;
BEGIN
  FOR v_store_id IN SELECT id FROM public.stores LOOP
    
    INSERT INTO public.scratch_cards (
      store_id, title, description, reward_type, reward_value, trigger_type, surface_color, status
    ) VALUES (
      v_store_id, 'Welcome Surprise!', 'Scratch for a gift as a new member', 'points', 250, 'welcome', '#4F46E5', 'active'
    ) RETURNING id INTO v_card_id;

    INSERT INTO public.scratch_cards (
      store_id, title, description, reward_type, reward_value, trigger_type, surface_color, status
    ) VALUES (
      v_store_id, 'Birthday Magic!', 'Happy Birthday! Scratch for a special reward', 'double_points', 2, 'birthday', '#EC4899', 'active'
    );

    INSERT INTO public.scratch_cards (
      store_id, title, description, reward_type, reward_value, trigger_type, surface_color, status
    ) VALUES (
      v_store_id, 'Level Up Reward!', 'Congratulations on your new tier!', 'discount', 15, 'tier_upgrade', '#F59E0B', 'active'
    );

    INSERT INTO public.scratch_cards (
      store_id, title, description, reward_type, reward_value, trigger_type, surface_color, status
    ) VALUES (
      v_store_id, 'Mystery Prize', 'Limited time mystery reward', 'points', 500, 'manual', '#10B981', 'active'
    );

    FOR v_user_id IN (SELECT user_id FROM public.user_store_memberships WHERE store_id = v_store_id) LOOP
      INSERT INTO public.scratch_card_claims (card_id, user_id, store_id, is_revealed)
      SELECT id, v_user_id, v_store_id, false 
      FROM public.scratch_cards 
      WHERE store_id = v_store_id AND trigger_type = 'welcome' 
      LIMIT 1;

      INSERT INTO public.scratch_card_claims (card_id, user_id, store_id, is_revealed)
      SELECT id, v_user_id, v_store_id, false 
      FROM public.scratch_cards 
      WHERE store_id = v_store_id AND trigger_type = 'manual' 
      LIMIT 1;
    END LOOP;

  END LOOP;
END $$;
