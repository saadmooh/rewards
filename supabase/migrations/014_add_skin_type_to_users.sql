-- Add skin_type column to users table for spa personalization

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS skin_type TEXT
CHECK (skin_type IN ('Dry', 'Oily', 'Sensitive', 'Combination', 'Normal'));

COMMENT ON COLUMN public.users.skin_type IS 'User skin type for personalized treatment recommendations';