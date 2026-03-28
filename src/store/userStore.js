import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { initializeDatabase, seedDemoData } from '../lib/setup-db'

const useUserStore = create((set, get) => ({
  user: null,
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
    try {
      // Try to find existing user
      let { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!user) {
        // Create new user
        const newUser = {
          telegram_id: telegramId,
          username: telegramData?.username || null,
          full_name: `${telegramData?.first_name || ''} ${telegramData?.last_name || ''}`.trim() || 'User',
          points: 100, // Welcome bonus
          tier: 'bronze',
        }
        
        const { data: created, error: createError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single()

        if (createError) throw createError
        user = created
      }

      set({ user, loading: false, error: null })
      return user
    } catch (err) {
      console.error('initUser error:', err)
      // Fallback to demo user
      set({
        user: {
          id: 'demo-' + Date.now(),
          telegram_id: telegramId,
          username: telegramData?.username,
          first_name: telegramData?.first_name,
          last_name: telegramData?.last_name,
          full_name: `${telegramData?.first_name || 'User'} ${telegramData?.last_name || ''}`.trim(),
          points: 4250,
          tier: 'gold',
        },
        loading: false,
        error: err.message
      })
    }
  },

  refreshUser: async () => {
    const { user } = get()
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      if (data) {
        set({ user: data })
      }
    } catch (err) {
      set({ error: err.message })
    }
  },

  updateBirthDate: async (birthDate) => {
    const { user } = get()
    if (!user?.id) return
    
    try {
      await supabase
        .from('users')
        .update({ birth_date: birthDate })
        .eq('id', user.id)
      
      set({ user: { ...user, birth_date: birthDate } })
    } catch (err) {
      set({ error: err.message })
    }
  },

  addPoints: async (points, note) => {
    const { user } = get()
    if (!user?.id) return
    
    try {
      // Add transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'earn',
        points: points,
        note: note,
      })

      // Update user points
      const newPoints = user.points + points
      await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', user.id)

      set({ user: { ...user, points: newPoints } })
    } catch (err) {
      set({ error: err.message })
    }
  },

  redeemOffer: async (offerId, pointsCost) => {
    const { user } = get()
    if (!user?.id || user.points < pointsCost) return false
    
    try {
      // Create redemption
      const { data: redemption, error: redeemError } = await supabase
        .from('redemptions')
        .insert({ user_id: user.id, offer_id: offerId })
        .select()
        .single()

      if (redeemError) throw redeemError

      // Deduct points
      const newPoints = user.points - pointsCost
      await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', user.id)

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'redeem',
        points: -pointsCost,
        offer_id: offerId,
        note: 'Used offer',
      })

      set({ user: { ...user, points: newPoints } })
      return redemption
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  setError: (error) => set({ error }),
}))

export default useUserStore
