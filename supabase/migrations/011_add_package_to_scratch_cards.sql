-- Update scratch_cards to support package rewards
ALTER TABLE public.scratch_cards 
DROP CONSTRAINT IF EXISTS scratch_cards_reward_type_check;

ALTER TABLE public.scratch_cards 
ADD CONSTRAINT scratch_cards_reward_type_check 
CHECK (reward_type IN ('points', 'discount', 'gift', 'double_points', 'package'));

ALTER TABLE public.scratch_cards 
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.offer_packages(id) ON DELETE SET NULL;
