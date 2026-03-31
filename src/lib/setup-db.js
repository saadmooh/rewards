import { supabase } from './supabase'
import { getStoreSlug } from './store'

export async function initializeDatabase() {
  console.log('Checking database tables...')

  try {
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
  // Check if demo store exists
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', getStoreSlug())
    .maybeSingle()

  if (!store) {
    console.log('No demo store found. Run SUPABASE_SETUP.md SQL first.')
    return
  }

  // Check if offers already exist for this store
  const { count: offerCount } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store.id)

  if (offerCount > 0) {
    console.log('Demo data already seeded!')
    return
  }

  // Seed demo offers
  const offers = [
    { store_id: store.id, title: '30% Off Shirts', description: 'Valid on all shirts and blouses', type: 'discount', discount_percent: 30, points_cost: 500, min_tier: 'bronze', occasion_type: 'always', is_active: true },
    { store_id: store.id, title: 'Double Points', description: 'Earn 2x points this weekend', type: 'double_points', points_cost: 0, min_tier: 'bronze', occasion_type: 'flash', is_active: true },
    { store_id: store.id, title: 'Free Gift', description: 'Free accessory with purchase over 5000 DZD', type: 'gift', points_cost: 300, min_tier: 'silver', occasion_type: 'fixed', is_active: true },
    { store_id: store.id, title: 'Exclusive Preview', description: 'Early access to new collection', type: 'exclusive', points_cost: 200, min_tier: 'gold', occasion_type: 'always', is_active: true },
    { store_id: store.id, title: 'Flash Sale 50%', description: '50% off clearance items', type: 'flash', discount_percent: 50, points_cost: 0, min_tier: 'bronze', occasion_type: 'flash', is_active: true },
  ]

  const { error: offersError } = await supabase.from('offers').insert(offers)
  if (offersError && !offersError.message.includes('duplicate')) console.log('Offers seed:', offersError.message)

  // Seed demo products
  const products = [
    { store_id: store.id, name: 'Premium Coffee Maker', description: 'State-of-the-art coffee machine', price: 299, category: 'appliances', is_active: true },
    { store_id: store.id, name: 'Wireless Earbuds Pro', description: 'High-quality audio with ANC', price: 199, category: 'electronics', is_active: true },
    { store_id: store.id, name: 'Yoga Mat Premium', description: 'Eco-friendly non-slip yoga mat', price: 49, category: 'fitness', is_active: true },
    { store_id: store.id, name: 'Smart Watch Series X', description: 'Advanced fitness tracking', price: 349, category: 'electronics', is_active: true },
    { store_id: store.id, name: 'Designer Handbag', description: 'Elegant leather handbag', price: 179, category: 'fashion', is_active: true },
    { store_id: store.id, name: 'Blender Set Professional', description: 'High-performance kitchen blender', price: 129, category: 'appliances', is_active: true },
  ]

  const { error: productsError } = await supabase.from('products').insert(products)
  if (productsError && !productsError.message.includes('duplicate')) console.log('Products seed:', productsError.message)

  console.log('Demo data seeded!')
}

export async function seedStoreAlphaData(storeId, userId) {
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)

  if (productCount > 0) {
    console.log('store-alpha data already seeded')
    return
  }

  const products = [
    { store_id: storeId, name: 'Premium Coffee Maker', description: 'State-of-the-art coffee machine', price: 299, category: 'appliances', is_active: true },
    { store_id: storeId, name: 'Wireless Earbuds Pro', description: 'High-quality audio', price: 199, category: 'electronics', is_active: true },
    { store_id: storeId, name: 'Yoga Mat Premium', description: 'Eco-friendly yoga mat', price: 49, category: 'fitness', is_active: true },
    { store_id: storeId, name: 'Smart Watch Series X', description: 'Advanced tracking features', price: 349, category: 'electronics', is_active: true },
    { store_id: storeId, name: 'Designer Handbag', description: 'Elegant leather handbag', price: 179, category: 'fashion', is_active: true },
    { store_id: storeId, name: 'Blender Set Professional', description: 'High-performance blender', price: 129, category: 'appliances', is_active: true },
  ]

  const { error: productsError } = await supabase.from('products').insert(products)
  if (productsError) console.log('Products seed error:', productsError.message)

  const offers = [
    { store_id: storeId, title: '30% Off Shirts', description: 'Valid on all shirts', type: 'discount', discount_percent: 30, points_cost: 500, min_tier: 'bronze', valid_until: '2026-12-31', is_active: true },
    { store_id: storeId, title: 'Double Points', description: 'Earn 2x points on all purchases', type: 'double_points', points_cost: 0, min_tier: 'bronze', valid_until: '2026-12-31', is_active: true },
    { store_id: storeId, title: 'Free Gift', description: 'Free gift with purchase over 5000 points', type: 'gift', points_cost: 300, min_tier: 'silver', valid_until: '2026-12-31', is_active: true },
  ]

  const { error: offersError } = await supabase.from('offers').insert(offers)
  if (offersError) console.log('Offers seed error:', offersError.message)

  console.log('store-alpha data seeded for user:', userId)
}
