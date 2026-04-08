-- ============================================================
--  Fix Redemptions Schema
--  Syncs redemptions table with current application logic
-- ============================================================

-- 1. Ensure points_spent exists (mandatory for logic)
ALTER TABLE public.redemptions 
ADD COLUMN IF NOT EXISTS points_spent INTEGER NOT NULL DEFAULT 0;

-- 2. Standardize coupon expiry column name
-- If expires_at exists from previous migrations, move data to coupon_code_expires_at
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='redemptions' AND column_name='expires_at') THEN
        -- Add the correct column if it doesn't exist
        ALTER TABLE public.redemptions ADD COLUMN IF NOT EXISTS coupon_code_expires_at TIMESTAMPTZ;
        
        -- Copy data
        UPDATE public.redemptions SET coupon_code_expires_at = expires_at WHERE coupon_code_expires_at IS NULL;
        
        -- Drop the old column
        ALTER TABLE public.redemptions DROP COLUMN expires_at;
    ELSE
        -- Just ensure the correct column exists
        ALTER TABLE public.redemptions ADD COLUMN IF NOT EXISTS coupon_code_expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Ensure other coupon columns exist
ALTER TABLE public.redemptions 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS products JSONB;

-- 4. Update index for the standardized column
DROP INDEX IF EXISTS idx_redemptions_expires_at;
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon_expiry ON public.redemptions (coupon_code_expires_at);
