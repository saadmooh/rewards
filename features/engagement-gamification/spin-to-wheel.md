# Spin-to-Wheel

## Overview
Daily or weekly lucky draw wheel where users spin to win bonus points, discounts, or surprise offers.

## Mechanics
- Wheel segments with weighted probabilities (e.g., 10pts, 25pts, 50pts, free coffee, 10% off)
- Free spin per day/week per membership
- Configurable segments per store
- Animated wheel spin with Framer Motion
- Prize auto-credited after spin

## Implementation Notes
- `wheel_config` table or JSONB column on `stores` with segment definitions and weights
- `wheel_spins` table to track usage and prevent abuse
- Server-side prize determination to prevent client manipulation
- Confetti + celebration modal on win

## Database Changes
```sql
wheel_spins (id, user_id, store_id, membership_id, prize_type, prize_value, spun_at)

-- Or store in stores table:
wheel_config jsonb  -- [{ label: '10pts', value: 10, weight: 40, type: 'points' }, ...]
```
