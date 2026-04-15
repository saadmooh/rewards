# Customer Feedback

## Overview
Collect ratings and reviews after purchases or redemptions to measure satisfaction and improve service.

## Mechanics
- Post-purchase prompt: 1-5 star rating + optional comment
- Post-redemption survey: satisfaction with the offer/product
- Merchant dashboard: average rating, recent reviews, trend chart
- Low-rating alerts: notify merchant when rating drops below threshold
- Response capability: merchant can reply to feedback

## Implementation Notes
- Feedback prompt shown after claim success or redemption confirmation
- Stored in `customer_feedback` table linked to transaction or redemption
- Aggregate stats computed on dashboard load (or cached)
- Negative feedback triggers optional escalation flow
- Feedback data used in customer segmentation

## Database Changes
```sql
customer_feedback (
  id, store_id, user_id, transaction_id, redemption_id,
  rating, comment, category, merchant_response,
  responded_at, created_at
)
-- rating: 1-5
-- category: 'product_quality', 'service', 'offer_value', 'delivery', 'general'
```
