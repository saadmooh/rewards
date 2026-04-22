-- Migration to add spa-wellness fields to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS skin_type_compatibility TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS aftercare_tips TEXT;
