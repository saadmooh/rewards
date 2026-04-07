import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useUserStore from '../store/userStore'

export const useOffers = () => {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { store, membership, user } = useUserStore()

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const today = new Date()
        const userBirthDate = user?.birth_date ? new Date(user.birth_date) : null
        const isBirthday = userBirthDate && 
          userBirthDate.getMonth() === today.getMonth() && 
          userBirthDate.getDate() === today.getDate()

        let query = supabase
          .from('offers')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (store?.id) {
          query = query.eq('store_id', store.id)
        }

        const { data, error } = await query

        if (error) throw error

        const userPoints = membership?.points || 0
        const userTier = membership?.tier || 'bronze'

        const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 }
        const userTierLevel = tierOrder[userTier] || 0

        const filteredOffers = (data || []).filter(offer => {
          // Filter by occasion_type (birthday offers only for users on their birthday)
          if (offer.occasion_type === 'birthday' && !isBirthday) {
            return false
          }

          // Filter by min_tier (only show to users who meet the tier requirement)
          const offerMinTierLevel = tierOrder[offer.min_tier] || 0
          if (userTierLevel < offerMinTierLevel) return false

          // Filter by points_cost (only show to users who have enough points)
          // Show all offers, but filter out ones user can't afford
          if (offer.points_cost > 0 && userPoints < offer.points_cost) {
            return false
          }

          return true
        })

        setOffers(filteredOffers)
      } catch (err) {
        console.error('useOffers error:', err)
        setOffers([])
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [store?.id, membership?.points, membership?.tier, user?.birth_date])

  return { offers, loading, error }
}

export const useOffer = (offerId) => {
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!offerId) {
      setLoading(false)
      return
    }

    const fetchOffer = async () => {
      try {
        const { data, error } = await supabase
          .from('offers')
          .select('*')
          .eq('id', offerId)
          .single()

        if (error) throw error
        setOffer(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOffer()
  }, [offerId])

  return { offer, loading, error }
}
