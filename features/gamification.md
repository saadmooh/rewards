# Game & Spin Wheel

## Description
Add gamification elements to increase engagement:
- Weekly spin wheel for bonus points
- Daily check-in rewards
- Achievement badges
- Challenges (spend X points, visit Y times)

## Implementation
- Create wheel configurations in database
- Track daily check-ins
- Create achievements table
- Add challenge system

## Database Schema
```sql
CREATE TABLE spin_wheel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  segments JSONB NOT NULL, -- [{label, points, weight}]
  daily_spin_limit INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE daily_checkins (
  user_id UUID REFERENCES users(id),
  store_id UUID REFERENCES stores(id),
  checkin_date DATE NOT NULL,
  points_earned INTEGER DEFAULT 1,
  UNIQUE(user_id, store_id, checkin_date)
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  condition JSONB NOT NULL -- {type, target}
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
```

## Priority
Medium