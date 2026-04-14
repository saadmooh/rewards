import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { initializeDatabase, seedDemoData, seedStoreAlphaData } from '../lib/setup-db'
import { getStoreSlug, getStoreName, getStartParam } from '../lib/store'

// Helper to generate a 4-digit numeric coupon code
const generateFourDigitCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const useUserStore = create((set, get) => ({
  user: null,
  membership: null,
  store: null,
  loading: true,
  initialized: false,
  error: null,

  init: async () => {
    if (get().initialized) return

    try {
      const result = await initializeDatabase()
      if (result.needsSetup) {
        console.log('Database needs setup')
      } else {
        await seedDemoData()
      }
    } catch (err) {
      console.error('Init error:', err)
    }
    set({ initialized: true })
  },

  initUser: async (telegramId, telegramData) => {
    console.log('[initUser] Starting with telegramId:', telegramId, 'username:', telegramData?.username)
    set({ loading: true })
    const storeSlug = getStoreSlug()
    const startParam = getStartParam()
    console.log('[initUser] storeSlug:', storeSlug, 'startParam:', startParam)

    try {
      // 1. Get or create store
      console.log('[initUser] Step 1: Looking up store by slug:', storeSlug)
      let { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', storeSlug)
        .maybeSingle()

      if (storeError) {
        console.error('[initUser] Store lookup error:', storeError)
        throw storeError
      }

      if (!store) {
        console.log('[initUser] Store not found, creating new store:', storeSlug)
        const { data: created, error: createErr } = await supabase
          .from('stores')
          .insert({
            slug: storeSlug,
            name: getStoreName(),
            owner_email: 'saad@example.com',
            owner_username: telegramData?.username || 'anonymous',
            bot_token: 'DEMO_' + storeSlug,
            bot_username: storeSlug + '_bot',
          })
          .select()
          .single()
        if (createErr) {
          console.error('[initUser] Store create error:', createErr)
          throw createErr
        }
        store = created
        console.log('[initUser] Store created:', store.id, store.name)
      } else {
        console.log('[initUser] Store found:', store.id, store.name)
      }

      // 2. Get or create user
      console.log('[initUser] Step 2: Looking up user by telegram_id:', telegramId)
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle()

      if (userError) {
        console.error('[initUser] User lookup error:', userError)
        throw userError
      }

      if (!user) {
        console.log('[initUser] User not found, creating new user')
        const fullName = `${telegramData?.first_name || ''} ${telegramData?.last_name || ''}`.trim() || 'User'
        const { data: created, error: createErr } = await supabase
          .from('users')
          .insert({
            telegram_id: telegramId,
            username: telegramData?.username || null,
            full_name: fullName,
            language_code: telegramData?.language_code || null,
            is_premium: telegramData?.is_premium || false,
            is_bot: telegramData?.is_bot || false,
            photo_url: telegramData?.photo_url || null,
            allows_write_to_pm: telegramData?.allows_write_to_pm || false,
            added_to_attachment_menu: telegramData?.added_to_attachment_menu || false,
            phone_number: telegramData?.phone_number || null,
            raw_telegram_data: telegramData || null,
          })
          .select()
          .single()
        if (createErr) {
          console.error('[initUser] User create error:', createErr)
          throw createErr
        }
        user = created
        console.log('[initUser] User created:', user.id, user.full_name)
      } else {
        console.log('[initUser] User found:', user.id, user.full_name)
      }

      // 3. Get or create membership
      console.log('[initUser] Step 3: Looking up membership for user:', user.id, 'store:', store.id)
      let { data: membership, error: memError } = await supabase
        .from('user_store_memberships')
        .select('*, roles(*)')
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .maybeSingle()

      if (memError) {
        console.error('[initUser] Membership lookup error:', memError)
        throw memError
      }

      // REPAIR LOGIC: If membership exists but missing role_id (legacy data)
      if (membership && !membership.role_id) {
        console.log('[initUser] Membership found but missing role_id, repairing...')
        const oldRoleSlug = membership.role || 'client'
        const { data: roleData } = await supabase.from('roles').select('id').eq('slug', oldRoleSlug).single()
        if (roleData) {
          const { data: updated } = await supabase
            .from('user_store_memberships')
            .update({ role_id: roleData.id })
            .eq('id', membership.id)
            .select('*, roles(*)')
            .single()
          if (updated) membership = updated
        }
      }

      const isNewMembership = !membership

      if (!membership) {
        // Check if this is the FIRST member for this specific store
        const { count: currentMemberCount, error: countErr } = await supabase
          .from('user_store_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id)

        if (countErr) {
          console.error('[initUser] Error counting store members:', countErr)
          throw countErr
        }

        const isFirstUser = (currentMemberCount === 0)
        const targetRoleSlug = isFirstUser ? 'owner' : 'client'
        
        console.log(`[initUser] Creating new membership. Store current members: ${currentMemberCount}. Assigned role: ${targetRoleSlug}`)
        
        const { data: roleData, error: roleErr } = await supabase
          .from('roles')
          .select('id')
          .eq('slug', targetRoleSlug)
          .single()

        if (roleErr || !roleData) {
          console.error(`[initUser] Could not find role with slug: ${targetRoleSlug}.`, roleErr)
          throw new Error(`Role '${targetRoleSlug}' missing in database`)
        }

        const { data: created, error: createErr } = await supabase
          .from('user_store_memberships')
          .insert({
            user_id: user.id,
            store_id: store.id,
            points: store.welcome_points || 100,
            role_id: roleData.id,
          })
          .select('*, roles(*)')
          .single()
        
        if (createErr) {
          console.error('[initUser] Membership insert failed:', createErr)
          throw createErr
        }
        membership = created
        console.log('[initUser] Membership successfully created:', membership.id)

        // Referral logic: reward referrer if startParam exists
        if (startParam && startParam.startsWith('ref_')) {
          const referrerCode = startParam.replace('ref_', '')
          console.log('[initUser] Referral detected. Referrer code:', referrerCode)

          const { data: referrerMembership, error: refErr } = await supabase
            .from('user_store_memberships')
            .select('user_id, points, id')
            .eq('referral_code', referrerCode)
            .eq('store_id', store.id)
            .single()

          if (!refErr && referrerMembership && referrerMembership.user_id !== user.id) {
            const rewardPoints = store.referral_reward_points || 200
            console.log(`[initUser] Rewarding referrer ${referrerMembership.user_id} with ${rewardPoints} points`)

            // 1. Reward Referrer
            await supabase
              .from('user_store_memberships')
              .update({ points: referrerMembership.points + rewardPoints })
              .eq('id', referrerMembership.id)

            await supabase.from('transactions').insert({
              user_id: referrerMembership.user_id,
              store_id: store.id,
              membership_id: referrerMembership.id,
              type: 'earn',
              points: rewardPoints,
              note: 'مكافأة دعوة صديق',
            })

            // 2. Reward Referee (extra points on top of welcome)
            const refereePoints = membership.points + rewardPoints
            await supabase
              .from('user_store_memberships')
              .update({ 
                points: refereePoints,
                referred_by_id: referrerMembership.user_id 
              })
              .eq('id', membership.id)

            await supabase.from('transactions').insert({
              user_id: user.id,
              store_id: store.id,
              membership_id: membership.id,
              type: 'earn',
              points: rewardPoints,
              note: 'مكافأة التسجيل عبر دعوة',
            })

            // Update local state for membership
            membership.points = refereePoints
            membership.referred_by_id = referrerMembership.user_id
          }
        }

        // Seed store data IF this is the first user
        if (isFirstUser) {
          console.log('[initUser] First user join, seeding default store data...')
          await seedStoreAlphaData(store.id, user.id)
        }

        // Welcome transaction
        await supabase.from('transactions').insert({
          user_id: user.id,
          store_id: store.id,
          membership_id: membership.id,
          type: 'welcome',
          points: store.welcome_points || 100,
          note: 'نقاط الترحيب',
        })
      } else {
        console.log('[initUser] User is already a member of this store.')
      }

      // Apply store accent color
      if (store.primary_color) {
        document.documentElement.style.setProperty('--accent', store.primary_color)
      }

      console.log('[initUser] Complete! user:', user.id, 'store:', store.id, 'membership:', membership.id)
      set({ user, membership, store, loading: false, error: null })
    } catch (err) {
      console.error('[initUser] FATAL error during initialization:', err.message, err)
      // Fallback with demo data so the app doesn't crash completely
      set({
        user: { id: 'demo-' + Date.now(), telegram_id: telegramId, full_name: `${telegramData?.first_name || 'User'} ${telegramData?.last_name || ''}`.trim() },
        membership: { id: 'demo-mem', points: 4250, tier: 'gold', roles: { slug: 'owner', permissions: { can_access_dashboard: true } } },
        store: { id: 'demo-store', name: getStoreName(), primary_color: '#D4AF37' },
        loading: false,
        error: err.message,
      })
    }
  },

  refreshMembership: async () => {
    const { user, store } = get()
    if (!user?.id || !store?.id) return
    const { data, error } = await supabase.from('user_store_memberships').select('*, roles(*)').eq('user_id', user.id).eq('store_id', store.id).single()
    if (!error && data) set({ membership: data })
  },

  updateBirthDate: async (birthDate) => {
    const { user } = get()
    if (!user?.id) return
    try {
      await supabase.from('users').update({ birth_date: birthDate }).eq('id', user.id)
      set({ user: { ...user, birth_date: birthDate } })
    } catch (err) { 
      console.error('Error updating birth date:', err)
      set({ error: err.message }) 
    }
  },

  addPoints: async (points, note) => {
    const { user, membership, store } = get()
    if (!user?.id || !membership?.id || !store?.id) return
    try {
      const newPoints = membership.points + points
      await supabase.from('user_store_memberships').update({ points: newPoints }).eq('id', membership.id)
      await supabase.from('transactions').insert({ user_id: user.id, store_id: store.id, membership_id: membership.id, type: 'earn', points, note })
      set({ membership: { ...membership, points: newPoints } })
    } catch (err) { set({ error: err.message }) }
  },

  redeemOffer: async (offerId, pointsCost) => {
    const { user, membership, store } = get()
    if (!user?.id || !membership?.id || !store?.id || membership.points < pointsCost) return false
    try {
      // Fetch products associated with the offer via offer_products junction
      const { data: offerProductData, error: offerProductError } = await supabase
        .from('offer_products')
        .select('product_id')
        .eq('offer_id', offerId);

      if (offerProductError) {
        console.error('Error fetching products for offer:', offerProductError);
        throw offerProductError;
      }

      const productIds = offerProductData ? offerProductData.map(op => op.product_id) : [];

      // Generate 4-digit coupon code
      const couponCode = generateFourDigitCode();

      // Set coupon expiry (24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Update user points
      const newPoints = membership.points - pointsCost;
      await supabase.from('user_store_memberships').update({ points: newPoints }).eq('id', membership.id);

      // Insert redemption record
      const { data: redemption, error: redemptionError } = await supabase
        .from('redemptions')
        .insert({
          user_id: user.id,
          store_id: store.id,
          offer_id: offerId,
          points_spent: pointsCost, // Add mandatory field
          coupon_code: couponCode, // Store generated code
          coupon_code_expires_at: expiresAt, // Use correct column name
          products: productIds,    // Store linked product IDs
        })
        .select()
        .single();

      if (redemptionError) {
        console.error('Error inserting redemption record:', redemptionError);
        throw redemptionError;
      }

      // Fetch offer title for transaction note
      const { data: offerData } = await supabase
        .from('offers')
        .select('title')
        .eq('id', offerId)
        .single();

      // Create transaction record
      await supabase.from('transactions').insert({
        user_id: user.id,
        store_id: store.id,
        membership_id: membership.id,
        type: 'redeem',
        points: -pointsCost,
        offer_id: offerId,
        note: `استبدال عرض: ${offerData?.title || 'عرض'}`,
      });

      set({ membership: { ...membership, points: newPoints } });
      return { coupon_code: couponCode }; // Return coupon_code as per plan
    } catch (err) {
      console.error('Error in redeemOffer:', err.message, err);
      set({ error: err.message });
      return null;
    }
  },

  setError: (error) => set({ error }),
}))

export default useUserStore
