# Leaderboards

## Overview
Rank customers by points, tier, or spend within a store to foster friendly competition.

## Variants
- **All-time top spenders**: Ranked by `total_spent`
- **Monthly earners**: Points earned in current calendar month
- **Tier champions**: Users who reached a tier first
- Store owner can toggle visibility and reset period

## Implementation Notes
- Query `user_store_memberships` ordered by relevant metric
- Display top 10-50 with rank, name, tier badge, and value
- Current user's rank always shown (even if not in top N)
- Privacy: users can opt-out of leaderboard
- Refresh cadence: daily or real-time with caching

## Database Changes
No new tables required. Query optimization with indexes on `total_spent`, `tier`, `points`.

```sql
-- Example: monthly top earners
SELECT user_id, SUM(points) as monthly_points
FROM transactions
WHERE store_id = ? AND type = 'earn'
  AND created_at >= date_trunc('month', now())
GROUP BY user_id
ORDER BY monthly_points DESC
LIMIT 50;
```
