import { supabase } from './supabase'

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  birth_date DATE,
  points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  join_date TIMESTAMPTZ DEFAULT now(),
  last_purchase TIMESTAMPTZ,
  referral_code TEXT UNIQUE DEFAULT substr(md5(random()::text),1,8)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT CHECK (type IN ('earn','redeem')),
  points INTEGER NOT NULL,
  amount NUMERIC(10,2),
  qr_token TEXT UNIQUE,
  qr_used BOOLEAN DEFAULT FALSE,
  qr_expires_at TIMESTAMPTZ,
  offer_id UUID REFERENCES offers(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('discount','exclusive_view','gift','double_points','flash')),
  discount_percent INTEGER,
  points_cost INTEGER NOT NULL,
  min_tier TEXT DEFAULT 'bronze',
  occasion_type TEXT CHECK (occasion_type IN ('fixed','birthday','anniversary','win_back','flash','always')),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  offer_id UUID REFERENCES offers(id),
  coupon_code TEXT UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text),1,10)),
  used_at TIMESTAMPTZ DEFAULT now(),
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ DEFAULT now() + interval '24 hours'
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_exclusive BOOLEAN DEFAULT FALSE,
  min_tier_to_view TEXT DEFAULT 'bronze',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id),
  referred_id UUID REFERENCES users(id) UNIQUE,
  bonus_points INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT now()
);
`

export async function initializeDatabase() {
  console.log('Checking database tables...')
  
  try {
    // Check if users table exists
    const { error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (checkError?.code === '42P01') {
      console.log('Tables not found. Please run the SQL schema in Supabase dashboard.')
      return { success: false, error: 'Tables not created', needsSetup: true }
    }
    
    console.log('Database tables exist!')
    return { success: true }
  } catch (err) {
    console.error('Database check failed:', err)
    return { success: false, error: err.message, needsSetup: true }
  }
}

export async function seedDemoData() {
  // Check if data already exists
  const { count: offerCount } = await supabase.from('offers').select('*', { count: 'exact', head: true })
  if (offerCount > 0) {
    console.log('Demo data already seeded!')
    return
  }

  // Seed demo offers
  const offers = [
    { title: '30% Off Shirts', description: 'Valid on all shirts and blouses', type: 'discount', discount_percent: 30, points_cost: 500, min_tier: 'bronze', occasion_type: 'always', is_active: true },
    { title: 'Double Points', description: 'Earn 2x points this weekend', type: 'double_points', points_cost: 0, min_tier: 'bronze', occasion_type: 'flash', is_active: true },
    { title: 'Free Gift', description: 'Free accessory with purchase over 5000 DZD', type: 'gift', points_cost: 300, min_tier: 'silver', occasion_type: 'fixed', is_active: true },
    { title: 'Exclusive Preview', description: 'Early access to new collection', type: 'exclusive_view', points_cost: 200, min_tier: 'gold', occasion_type: 'always', is_active: true },
    { title: 'Flash Sale 50%', description: '50% off clearance items', type: 'flash', discount_percent: 50, points_cost: 0, min_tier: 'bronze', occasion_type: 'flash', is_active: true },
  ]

  const { error: offersError } = await supabase.from('offers').insert(offers)
  if (offersError && !offersError.message.includes('duplicate')) console.log('Offers seed:', offersError.message)

  // Seed demo products
  const products = [
    { name: 'Premium Coffee Maker', description: 'State-of-the-art coffee machine', price: 299, category: 'appliances', is_active: true },
    { name: 'Wireless Earbuds Pro', description: 'High-quality audio with ANC', price: 199, category: 'electronics', is_active: true },
    { name: 'Yoga Mat Premium', description: 'Eco-friendly non-slip yoga mat', price: 49, category: 'fitness', is_active: true },
    { name: 'Smart Watch Series X', description: 'Advanced fitness tracking', price: 349, category: 'electronics', is_active: true },
    { name: 'Designer Handbag', description: 'Elegant leather handbag', price: 179, category: 'fashion', is_active: true },
    { name: 'Blender Set Professional', description: 'High-performance kitchen blender', price: 129, category: 'appliances', is_active: true },
  ]

  const { error: productsError } = await supabase.from('products').insert(products)
  if (productsError && !productsError.message.includes('duplicate')) console.log('Products seed:', productsError.message)

  console.log('Demo data seeded!')
}
