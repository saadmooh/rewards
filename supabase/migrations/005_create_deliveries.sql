-- Create deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    wilaya TEXT NOT NULL,
    municipality TEXT NOT NULL,
    address TEXT NOT NULL,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('home', 'office')),
    payment_method TEXT NOT NULL DEFAULT 'cod',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Policies (Using the "open-policy" pattern as seen in setup.sql)
DO $$ BEGIN
    DROP POLICY IF EXISTS "deliveries_select" ON public.deliveries;
    DROP POLICY IF EXISTS "deliveries_insert" ON public.deliveries;
    DROP POLICY IF EXISTS "deliveries_update" ON public.deliveries;
    DROP POLICY IF EXISTS "deliveries_delete" ON public.deliveries;
END $$;

CREATE POLICY "deliveries_select" ON public.deliveries FOR SELECT USING (TRUE);
CREATE POLICY "deliveries_insert" ON public.deliveries FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "deliveries_update" ON public.deliveries FOR UPDATE USING (TRUE);
CREATE POLICY "deliveries_delete" ON public.deliveries FOR DELETE USING (TRUE);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON public.deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_store_id ON public.deliveries(store_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
