-- Add is_cod_enabled to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS is_cod_enabled BOOLEAN NOT NULL DEFAULT TRUE;
