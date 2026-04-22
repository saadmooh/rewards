-- Migration 019: Recreate bookings table with start_time/end_time and updated RLS

-- Drop existing bookings table (if exists) to apply new schema
DROP TABLE IF EXISTS public.bookings CASCADE;

CREATE TABLE public.bookings (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id      UUID      NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id       UUID      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id    UUID      NULL REFERENCES public.products(id) ON DELETE SET NULL,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow users to view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow store owners to view all bookings for their store" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
  );

CREATE POLICY "Allow users to create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow store owners to manage bookings for their store" ON public.bookings
  FOR UPDATE, DELETE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_bookings_store ON public.bookings(store_id);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_store_start ON public.bookings(store_id, start_time);
