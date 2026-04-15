-- ============================================================
--  Automated Campaigns — Migration
--  Engine : PostgreSQL (Supabase)
-- ============================================================

-- 1. Extend promotions table with automated campaign fields
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS trigger_type      TEXT      DEFAULT 'manual'
    CHECK (trigger_type IN ('manual','welcome','win_back','birthday','churn','tier_upgrade','milestone')),
  ADD COLUMN IF NOT EXISTS trigger_condition JSONB,
  ADD COLUMN IF NOT EXISTS status            TEXT      DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','completed')),
  ADD COLUMN IF NOT EXISTS message_template  JSONB,
  ADD COLUMN IF NOT EXISTS offer_id          UUID      REFERENCES public.offers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_run_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS send_count        INTEGER   NOT NULL DEFAULT 0;

-- 2. campaign_logs table — tracks each automated send attempt
CREATE TABLE IF NOT EXISTS public.campaign_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID      NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  promotion_id  UUID      NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id       UUID      NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  status        TEXT      NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','skipped','failed','opted_out')),
  error_message TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_logs_store_id     ON public.campaign_logs (store_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_promotion_id ON public.campaign_logs (promotion_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_user_id      ON public.campaign_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_sent_at      ON public.campaign_logs (sent_at);

-- 3. RLS for campaign_logs
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaign_logs_select" ON public.campaign_logs;
DROP POLICY IF EXISTS "campaign_logs_insert" ON public.campaign_logs;
DROP POLICY IF EXISTS "campaign_logs_update" ON public.campaign_logs;
DROP POLICY IF EXISTS "campaign_logs_delete" ON public.campaign_logs;

CREATE POLICY "campaign_logs_select" ON public.campaign_logs FOR SELECT USING (TRUE);
CREATE POLICY "campaign_logs_insert" ON public.campaign_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "campaign_logs_update" ON public.campaign_logs FOR UPDATE USING (TRUE);
CREATE POLICY "campaign_logs_delete" ON public.campaign_logs FOR DELETE USING (TRUE);

-- 4. View: eligible recipients per active automated campaign
--    Used by the Edge Function to determine who to notify.
CREATE OR REPLACE VIEW public.v_campaign_eligible_users AS
SELECT
  p.id        AS promotion_id,
  p.store_id,
  p.trigger_type,
  p.trigger_condition,
  p.message_template,
  p.image_url,
  p.cta_url,
  p.cta_label,
  p.offer_id,
  m.id        AS membership_id,
  m.user_id,
  m.tier,
  m.points,
  m.total_spent,
  m.last_purchase,
  m.joined_at,
  u.telegram_id,
  u.full_name,
  u.birth_date,
  EXTRACT(DAY FROM NOW() - m.joined_at)::INTEGER              AS days_since_join,
  EXTRACT(DAY FROM NOW() - COALESCE(m.last_purchase, m.joined_at))::INTEGER AS days_inactive
FROM public.promotions p
JOIN public.user_store_memberships m ON m.store_id = p.store_id
JOIN public.users u ON u.id = m.user_id
WHERE p.trigger_type != 'manual'
  AND p.status = 'active'
  AND (p.ends_at IS NULL OR p.ends_at > NOW())
  -- Apply trigger-specific filters
  AND (
    CASE p.trigger_type
      WHEN 'welcome' THEN
        EXTRACT(DAY FROM NOW() - m.joined_at) <= 7
      WHEN 'win_back' THEN
        EXTRACT(DAY FROM NOW() - COALESCE(m.last_purchase, m.joined_at)) >= 30
      WHEN 'birthday' THEN
        u.birth_date IS NOT NULL
        AND EXTRACT(MONTH FROM u.birth_date) = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(DAY FROM u.birth_date) = EXTRACT(DAY FROM NOW())
      WHEN 'churn' THEN
        COALESCE((p.trigger_condition->>'days_inactive')::INTEGER, 45)
          <= EXTRACT(DAY FROM NOW() - COALESCE(m.last_purchase, m.joined_at))
      WHEN 'tier_upgrade' THEN FALSE  -- reserved for future
      WHEN 'milestone' THEN
        COALESCE((p.trigger_condition->>'min_visits')::INTEGER, 0) <= m.visit_count
        OR COALESCE((p.trigger_condition->>'min_points')::INTEGER, 0) <= m.points
      ELSE FALSE
    END
  )
  -- Exclude recently notified users
  AND NOT EXISTS (
    SELECT 1 FROM public.campaign_logs cl
     WHERE cl.promotion_id = p.id
       AND cl.user_id = m.user_id
       AND cl.sent_at > NOW() - INTERVAL '24 hours'
  );

-- 5. SCHEDULE via pg_cron (uncomment after enabling pg_cron + pg_net extensions)
--    Alternatively, invoke the Edge Function from a cron service or Vercel cron.

-- SELECT cron.schedule(
--   'process-automated-campaigns',
--   '0 9 * * *',
--   $$ SELECT net.http_post(
--     current_setting('app.settings.edge_function_url') || '/process-automated-campaigns',
--     '{}'::jsonb
--   ) $$
-- );
