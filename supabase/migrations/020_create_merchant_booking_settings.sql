-- Migration 020: Create merchant_booking_settings table

CREATE TABLE IF NOT EXISTS public.merchant_booking_settings (
  store_id              UUID      PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  opening_time          TIME      NULL,
  closing_time          TIME      NULL,
  default_booking_duration INTEGER NULL,
  available_days        TEXT[]    NULL,
  time_zone             VARCHAR(50) NULL
);

ALTER TABLE public.merchant_booking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow store owners to manage their booking settings" ON public.merchant_booking_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

CREATE POLICY "Allow users to view store booking settings" ON public.merchant_booking_settings
  FOR SELECT USING (TRUE);
