# Multi-Branch Support

## Overview
Manage multiple store locations under one merchant account with unified reporting and per-branch operations.

## Mechanics
- Merchant account has a parent `stores` entry and multiple child branches
- Each branch has its own slug, address, team, and loyalty config (or inherits from parent)
- Customer can join individual branches or all branches
- Unified dashboard: aggregate stats + per-branch breakdown
- Cross-branch point earning and redemption (configurable)

## Implementation Notes
- `store_branches` table linking branches to parent store
- Branch selector in dashboard header
- Role permissions scoped to branch or all branches
- Cross-branch referrals and promotions
- Consolidated analytics with branch filter

## Database Changes
```sql
store_branches (
  id, parent_store_id, slug, name, address, city, phone,
  manager_id, is_active, primary_color, created_at
)

-- Link memberships to branch:
ALTER TABLE user_store_memberships ADD COLUMN branch_id uuid REFERENCES store_branches(id);

-- Extend roles to branch scope:
ALTER TABLE roles ADD COLUMN branch_id uuid REFERENCES store_branches(id);
-- NULL branch_id = role applies to all branches
```
