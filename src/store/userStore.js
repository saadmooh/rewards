import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { initializeDatabase, seedDemoData, seedStoreAlphaData } from '../lib/setup-db'
import { getStoreSlug, getStoreName, getStartParam } from '../lib/store'

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

      let storeJustCreated = false
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
        storeJustCreated = true
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

        // Only seed data for the very first user
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
        console.log('[initUser] Total users in DB:', userCount)
        if (userCount <= 1) {
          console.log('[initUser] First user, seeding store data')
          await seedStoreAlphaData(store.id, user.id)
        }
      } else {
        console.log('[initUser] User found:', user.id, user.full_name)
      }

      // 3. Get or create membership
      console.log('[initUser] Step 3: Looking up membership for user:', user.id, 'store:', store.id)
      let { data: membership, error: memError } = await supabase
        .from('user_store_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .maybeSingle()

      if (memError) {
        console.error('[initUser] Membership lookup error:', memError)
        throw memError
      }

      const isNewMembership = !membership

      if (!membership) {
        const isOwner = storeJustCreated
        console.log('[initUser] Membership not found, creating with role:', isOwner ? 'owner' : 'viewer', 'points:', store.welcome_points || 100)
        const { data: created, error: createErr } = await supabase
          .from('user_store_memberships')
          .insert({
            user_id: user.id,
            store_id: store.id,
            points: store.welcome_points || 100,
            role: isOwner ? 'owner' : 'viewer',
          })
          .select()
          .single()
        if (createErr) {
          console.error('[initUser] Membership create error:', createErr)
          throw createErr
        }
        membership = created
        console.log('[initUser] Membership created:', membership.id, 'tier:', membership.tier)

        // Welcome transaction
        console.log('[initUser] Creating welcome transaction')
        await supabase.from('transactions').insert({
          user_id: user.id,
          store_id: store.id,
          membership_id: membership.id,
          type: 'welcome',
          points: store.welcome_points || 100,
          note: 'نقاط الترحيب',
        })
      } else {
        console.log('[initUser] Membership found:', membership.id, 'points:', membership.points, 'tier:', membership.tier)
      }

      // 4. Handle referral
      if (isNewMembership && startParam?.startsWith('ref_')) {
        const referralCode = startParam.replace('ref_', '')
        console.log('[initUser] Step 4: Processing referral code:', referralCode)
        const { data: referrerMem } = await supabase
          .from('user_store_memberships')
          .select('user_id, id, points')
          .eq('referral_code', referralCode)
          .eq('store_id', store.id)
          .maybeSingle()

        if (referrerMem) {
          console.log('[initUser] Referrer found, awarding points')
          // Points for referrer
          await supabase
            .from('user_store_memberships')
            .update({ points: referrerMem.points + 200 })
            .eq('id', referrerMem.id)

          // Points for referred user
          await supabase
            .from('user_store_memberships')
            .update({ points: membership.points + 100 })
            .eq('id', membership.id)

          await supabase.from('referrals').insert({
            store_id: store.id,
            referrer_id: referrerMem.user_id,
            referred_id: user.id,
          })

          // Refresh membership
          const { data: updated } = await supabase
            .from('user_store_memberships')
            .select('*')
            .eq('id', membership.id)
            .single()
          if (updated) membership = updated
          console.log('[initUser] Referral complete, new points:', membership.points)
        } else {
          console.log('[initUser] No referrer found for code:', referralCode)
        }
      }

      // Apply store accent color
      if (store.primary_color) {
        document.documentElement.style.setProperty('--accent', store.primary_color)
        console.log('[initUser] Applied accent color:', store.primary_color)
      }

      console.log('[initUser] Done! user:', user.id, 'store:', store.id, 'membership:', membership.id, 'points:', membership.points)
      set({ user, membership, store, loading: false, error: null })
    } catch (err) {
      console.error('[initUser] FATAL error:', err.message, err)
      // Fallback with demo data
      set({
        user: {
          id: 'demo-' + Date.now(),
          telegram_id: telegramId,
          username: telegramData?.username,
          first_name: telegramData?.first_name,
          last_name: telegramData?.last_name,
          full_name: `${telegramData?.first_name || 'User'} ${telegramData?.last_name || ''}`.trim(),
          language_code: telegramData?.language_code || null,
          is_premium: telegramData?.is_premium || false,
          is_bot: telegramData?.is_bot || false,
          photo_url: telegramData?.photo_url || null,
          allows_write_to_pm: telegramData?.allows_write_to_pm || false,
          added_to_attachment_menu: telegramData?.added_to_attachment_menu || false,
        },
        membership: {
          id: 'demo-mem-' + Date.now(),
          points: 4250,
          tier: 'gold',
          total_spent: 0,
          total_visits: 0,
        },
        store: {
          id: '11111111-1111-1111-1111-111111111111',
          slug: storeSlug,
          name: getStoreName(),
          primary_color: '#D4AF37',
          tier_config: {
            bronze: { min: 0, max: 999 },
            silver: { min: 1000, max: 4999 },
            gold: { min: 5000, max: 9999 },
            platinum: { min: 10000, max: 999999 },
          },
        },
        loading: false,
        error: err.message,
      })
    }
  },

  refreshMembership: async () => {
    const { user, store } = get()
    if (!user?.id || !store?.id) return

    try {
      const { data, error } = await supabase
        .from('user_store_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .single()

      if (error) throw error
      if (data) set({ membership: data })
    } catch (err) {
      set({ error: err.message })
    }
  },

  addPoints: async (points, note) => {
    const { user, membership, store } = get()
    if (!user?.id || !membership?.id || !store?.id) return

    try {
      const newPoints = membership.points + points

      // Update membership points
      await supabase
        .from('user_store_memberships')
        .update({ points: newPoints })
        .eq('id', membership.id)

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        store_id: store.id,
        membership_id: membership.id,
        type: 'earn',
        points: points,
        note: note,
      })

      set({ membership: { ...membership, points: newPoints } })
    } catch (err) {
      set({ error: err.message })
    }
  },

  redeemOffer: async (offerId, pointsCost) => {
    const { user, membership, store } = get()
    if (!user?.id || !membership?.id || !store?.id) return false
    if (membership.points < pointsCost) return false

    try {
      const newPoints = membership.points - pointsCost

      // Create redemption
      const { data: redemption, error: redeemError } = await supabase
        .from('redemptions')
        .insert({
          user_id: user.id,
          store_id: store.id,
          offer_id: offerId,
        })
        .select()
        .single()

      if (redeemError) throw redeemError

      // Deduct from membership
      await supabase
        .from('user_store_memberships')
        .update({ points: newPoints })
        .eq('id', membership.id)

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        store_id: store.id,
        membership_id: membership.id,
        type: 'redeem',
        points: -pointsCost,
        offer_id: offerId,
        note: 'Used offer',
      })

      set({ membership: { ...membership, points: newPoints } })
      return redemption
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  setError: (error) => set({ error }),
}))

export default useUserStore
