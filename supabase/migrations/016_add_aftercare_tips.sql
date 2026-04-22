-- Add aftercare_tips to products table for spa treatments

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS aftercare_tips TEXT;

COMMENT ON COLUMN public.products.aftercare_tips IS 'Aftercare tips for maintaining treatment results';