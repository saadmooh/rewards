import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { initializeDatabase, seedDemoData } from '../lib/setup-db'
import { getStoreSlug, getStartParam } from '../lib/store'

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
    set({ loading: true })
    const storeSlug = getStoreSlug()
    const startParam = getStartParam()

    try {
      // 1. Get or create store
      let { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', storeSlug)
        .maybeSingle()

      if (storeError) throw storeError

      if (!store) {
        const { data: created, error: createErr } = await supabase
          .from('stores')
          .insert({
            slug: storeSlug,
            name: storeSlug.replace(/-/g, ' '),
            bot_token: 'DEMO_' + storeSlug,
            bot_username: storeSlug + '_bot',
          })
          .select()
          .single()
        if (createErr) throw createErr
        store = created
      }

      // 2. Get or create user
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle()

      if (userError) throw userError

      if (!user) {
        const fullName = `${telegramData?.first_name || ''} ${telegramData?.last_name || ''}`.trim() || 'User'
        const { data: created, error: createErr } = await supabase
          .from('users')
          .insert({
            telegram_id: telegramId,
            username: telegramData?.username || null,
            full_name: fullName,
            language_code: telegramData?.language_code || null,
            is_premium: telegramData?.is_premium || false,
            photo_url: telegramData?.photo_url || null,
            phone_number: telegramData?.phone_number || null,
            raw_telegram_data: telegramData || null,
          })
          .select()
          .single()
        if (createErr) throw createErr
        user = created
      }

      // 3. Get or create membership
      let { data: membership, error: memError } = await supabase
        .from('user_store_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .maybeSingle()

      if (memError) throw memError

      const isNewMembership = !membership

      if (!membership) {
        const { data: created, error: createErr } = await supabase
          .from('user_store_memberships')
          .insert({
            user_id: user.id,
            store_id: store.id,
            points: store.welcome_points || 100,
          })
          .select()
          .single()
        if (createErr) throw createErr
        membership = created

        // Welcome transaction
        await supabase.from('transactions').insert({
          user_id: user.id,
          store_id: store.id,
          membership_id: membership.id,
          type: 'welcome',
          points: store.welcome_points || 100,
          note: 'نقاط الترحيب',
        })
      }

      // 4. Handle referral
      if (isNewMembership && startParam?.startsWith('ref_')) {
        const referralCode = startParam.replace('ref_', '')
        const { data: referrerMem } = await supabase
          .from('user_store_memberships')
          .select('user_id, id, points')
          .eq('referral_code', referralCode)
          .eq('store_id', store.id)
          .maybeSingle()

        if (referrerMem) {
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
        }
      }

      // Apply store accent color
      if (store.primary_color) {
        document.documentElement.style.setProperty('--accent', store.primary_color)
      }

      set({ user, membership, store, loading: false, error: null })
    } catch (err) {
      console.error('initUser error:', err)
      // Fallback with demo data
      set({
        user: {
          id: 'demo-' + Date.now(),
          telegram_id: telegramId,
          username: telegramData?.username,
          first_name: telegramData?.first_name,
          last_name: telegramData?.last_name,
          full_name: `${telegramData?.first_name || 'User'} ${telegramData?.last_name || ''}`.trim(),
        },
        membership: {
          id: 'demo-mem-' + Date.now(),
          points: 4250,
          tier: 'gold',
          total_spent: 0,
          total_visits: 0,
        },
        store: {
          id: 'demo-store-id',
          slug: getStoreSlug(),
          name: 'Demo Store',
          primary_color: '#10b981',
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
