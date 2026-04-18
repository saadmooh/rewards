-- ============================================================
-- Update Scratch Cards Schema - Add Package Support
-- ============================================================

-- 1. Add package_id column to scratch_cards
ALTER TABLE public.scratch_cards 
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.offer_packages(id) ON DELETE SET NULL;

-- 2. Update reward_type check constraint
ALTER TABLE public.scratch_cards
DROP CONSTRAINT IF EXISTS scratch_cards_reward_type_check;

ALTER TABLE public.scratch_cards
ADD CONSTRAINT scratch_cards_reward_type_check 
CHECK (reward_type IN ('points', 'discount', 'gift', 'double_points', 'package'));

-- 3. Add index for performance
CREATE INDEX IF NOT EXISTS idx_scratch_cards_package_id ON public.scratch_cards (package_id);
