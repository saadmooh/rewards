-- Migration 021: Add booking override columns to products table

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS override_booking_settings BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS specific_opening_time TIME NULL,
ADD COLUMN IF NOT EXISTS specific_closing_time TIME NULL,
ADD COLUMN IF NOT EXISTS specific_booking_duration INTEGER NULL;
