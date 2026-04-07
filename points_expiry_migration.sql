-- ============================================================
--  Points Expiry System - Migration SQL
--  Add to existing Supabase database to enable points expiry
-- ============================================================

-- Add points expiry columns to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS points_expiry_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS points_expiry_months INTEGER NOT NULL DEFAULT 12;

-- Add points_earned_at to track when points were earned
ALTER TABLE public.user_store_memberships 
ADD COLUMN IF NOT EXISTS points_earned_at TIMESTAMPTZ;

-- Add index for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_memberships_points_earned_at 
ON public.user_store_memberships (points_earned_at);

-- Function to expire points based on store settings
CREATE OR REPLACE FUNCTION public.expire_old_points()
RETURNS void
LANGUAGE plpgsql AS
$$
DECLARE
  v_membership RECORD;
  v_expired_count INTEGER := 0;
BEGIN
  FOR v_membership IN
    SELECT m.id, m.points, m.points_earned_at, s.points_expiry_months, m.store_id, m.user_id
    FROM public.user_store_memberships m
    JOIN public.stores s ON m.store_id = s.id
    WHERE s.points_expiry_enabled = true
      AND m.points > 0
      AND m.points_earned_at IS NOT NULL
      AND m.points_earned_at < NOW() - (s.points_expiry_months || ' months')::interval
  LOOP
    -- Record the expiry as a transaction
    INSERT INTO public.transactions (store_id, user_id, membership_id, type, points, description)
    VALUES (v_membership.store_id, v_membership.user_id, v_membership.id, 'expire', -v_membership.points, 'انتهاء صلاحية النقاط');

    -- Reset points to 0
    UPDATE public.user_store_memberships
       SET points = 0,
           points_earned_at = NULL,
           updated_at = NOW()
     WHERE id = v_membership.id;

    v_expired_count := v_expired_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Expired points for % memberships', v_expired_count;
END;
$$;

-- Trigger to update points_earned_at when points increase
CREATE OR REPLACE FUNCTION public.update_points_earned_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS
$$
BEGIN
  IF NEW.points > OLD.points THEN
    NEW.points_earned_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_points_earned_at ON public.user_store_memberships;

CREATE TRIGGER trg_points_earned_at
  BEFORE UPDATE OF points ON public.user_store_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_points_earned_at();

-- Optional: Schedule expiry check daily (requires pg_cron extension)
-- SELECT cron.schedule('expire-old-points', '0 0 * * *', 'SELECT expire_old_points()');
