# Export Reports

## Overview
CSV/PDF downloads for analytics, customer data, and transaction history for offline analysis and accounting.

## Export Types
- **Transactions Report**: All earn/redeem activity within date range
- **Customer List**: Names, tiers, points, total spent, last visit
- **Offer Performance**: Redemption counts, points spent, ROI
- **Revenue Summary**: Daily/weekly/monthly aggregates
- **Tier Distribution**: Count per tier at a point in time

## Implementation Notes
- Client-side CSV generation using `papaparse` or `csv-stringify`
- PDF generation via `jspdf` + `jspdf-autotable`
- Date range picker on export dialogs
- Large exports processed async with download link when ready
- Export history log in dashboard

## Database Changes
```sql
export_jobs (
  id, store_id, user_id, report_type, parameters::jsonb,
  status, file_url, created_at, completed_at
)
```
