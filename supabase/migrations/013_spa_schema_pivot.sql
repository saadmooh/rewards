-- Phase 2: Spa Schema Pivot
-- Add spa-specific fields to products table

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS benefits TEXT[],
ADD COLUMN IF NOT EXISTS skin_type_compatibility TEXT[];

-- Add index for spa queries
CREATE INDEX IF NOT EXISTS idx_products_duration ON public.products(duration_minutes) WHERE duration_minutes IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_skin_types ON public.products(skin_type_compatibility) USING GIN(skin_type_compatibility);

-- Add comment for documentation
COMMENT ON COLUMN public.products.duration_minutes IS 'Treatment duration in minutes';
COMMENT ON COLUMN public.products.benefits IS 'Array of treatment benefits (e.g., "Hydrating", "Anti-aging")';
COMMENT ON COLUMN public.products.skin_type_compatibility IS 'Array of compatible skin types (e.g., "Dry", "Oily", "Sensitive")';