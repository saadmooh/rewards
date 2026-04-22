-- Add skin_concerns column to users table for personalization

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS skin_concerns TEXT[]
CHECK (skin_concerns @> '{Aging,Acne,Redness,Hydration,Dark Spots}'::TEXT[]);

COMMENT ON COLUMN public.users.skin_concerns IS 'User skin concerns for personalized treatment recommendations';