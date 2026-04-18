-- ─────────────────────────────────────────────
--  012_scratch_card_triggers.sql
--  Automatic assignment of scratch cards on tier upgrades
-- ─────────────────────────────────────────────

-- 1. Helper function to get tier weight
CREATE OR REPLACE FUNCTION public.get_tier_weight(p_tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE p_tier
    WHEN 'bronze'   THEN 0
    WHEN 'silver'   THEN 1
    WHEN 'gold'     THEN 2
    WHEN 'platinum' THEN 3
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Updated update_user_tier function
CREATE OR REPLACE FUNCTION public.update_user_tier()
RETURNS TRIGGER
LANGUAGE plpgsql AS
$$
DECLARE
  v_tier_config JSONB;
  v_new_tier    TEXT;
  v_old_weight  INTEGER;
  v_new_weight  INTEGER;
  v_card_id     UUID;
BEGIN
  -- 1. Get tier config for this store
  SELECT tier_config
    INTO v_tier_config
    FROM public.stores
   WHERE id = NEW.store_id;

  -- 2. Calculate new tier based on current points
  v_new_tier :=
    CASE
      WHEN NEW.points >= (v_tier_config->>'platinum')::INTEGER THEN 'platinum'
      WHEN NEW.points >= (v_tier_config->>'gold')::INTEGER     THEN 'gold'
      WHEN NEW.points >= (v_tier_config->>'silver')::INTEGER   THEN 'silver'
      ELSE 'bronze'
    END;

  -- 3. If tier changed, update it
  IF v_new_tier IS DISTINCT FROM OLD.tier THEN
    v_old_weight := public.get_tier_weight(OLD.tier);
    v_new_weight := public.get_tier_weight(v_new_tier);

    -- 4. If it's an UPGRADE, check for scratch cards
    IF v_new_weight > v_old_weight THEN
      FOR v_card_id IN 
        SELECT id FROM public.scratch_cards 
        WHERE store_id = NEW.store_id 
          AND trigger_type = 'tier_upgrade' 
          AND status = 'active'
      LOOP
        INSERT INTO public.scratch_card_claims (card_id, user_id, store_id)
        VALUES (v_card_id, NEW.user_id, NEW.store_id)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;

    -- 5. Perform the actual update
    -- Note: We use a separate UPDATE here because we are in an AFTER trigger context 
    -- in some setups, but the standard is BEFORE. 
    -- However, setup.sql defines it as AFTER.
    -- If it's AFTER, we MUST update the table directly.
    UPDATE public.user_store_memberships
       SET tier       = v_new_tier,
           updated_at = NOW()
     WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Add add_points RPC if not exists
CREATE OR REPLACE FUNCTION public.add_points(p_user_id UUID, p_store_id UUID, p_points INTEGER)
RETURNS VOID AS $$
DECLARE
  v_membership_id UUID;
BEGIN
  SELECT id INTO v_membership_id 
  FROM public.user_store_memberships 
  WHERE user_id = p_user_id AND store_id = p_store_id;

  IF v_membership_id IS NOT NULL THEN
    UPDATE public.user_store_memberships 
    SET points = points + p_points,
        updated_at = NOW()
    WHERE id = v_membership_id;

    INSERT INTO public.transactions (store_id, user_id, membership_id, type, points, note)
    VALUES (p_store_id, p_user_id, v_membership_id, 'earn', p_points, 'نقاط مكافأة');
  END IF;
END;
$$ LANGUAGE plpgsql;
