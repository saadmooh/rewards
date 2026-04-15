# Compliance & Audit Log

## Overview
Track who did what and when — critical for team accountability, dispute resolution, and regulatory compliance.

## Events Logged
- Points adjustments (manual or system)
- Offer creation, editing, deletion
- Customer data changes (tier override, points override)
- Team member role changes
- Campaign creation and sends
- Settings changes (tier config, points rate)
- Redemptions and coupon invalidations

## Mechanics
- Append-only log table — no updates or deletes allowed
- Each entry: actor, action, target entity, before/after values, timestamp
- Filterable audit log view in dashboard (Admin only)
- Exportable for compliance reporting
- Retention policy: configurable (e.g., keep for 2 years)

## Implementation Notes
- Supabase database triggers on key tables, or application-level logging
- Dashboard page at `/dashboard/audit` with search and filters
- Actor resolved from `user_store_memberships` + `users`
- Sensitive actions require confirmation modal with reason entry
- Read-only for non-owner roles

## Database Changes
```sql
audit_log (
  id, store_id, actor_id, actor_role,
  action_type, target_table, target_id,
  before_values jsonb, after_values jsonb,
  reason text, ip_address, user_agent,
  created_at
)
-- action_type: 'create', 'update', 'delete', 'adjust', 'override', 'assign_role', 'change_settings'

-- Retention policy (run via Supabase cron):
-- DELETE FROM audit_log WHERE created_at < now() - interval '2 years';
```
