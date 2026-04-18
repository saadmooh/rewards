-- Fix scratch_card_claims RLS policy - remove auth.users dependency
DROP POLICY IF EXISTS "scratch_card_claims_select" ON public.scratch_card_claims;
DROP POLICY IF EXISTS "scratch_card_claims_update" ON public.scratch_card_claims;

CREATE POLICY "scratch_card_claims_select" ON public.scratch_card_claims FOR SELECT USING (TRUE);
CREATE POLICY "scratch_card_claims_update" ON public.scratch_card_claims FOR UPDATE USING (TRUE);