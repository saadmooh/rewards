import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useUserStore from '../store/userStore'

export const useOffers = () => {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useUserStore()

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data, error } = await supabase
          .from('offers')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOffers(data || [])
      } catch (err) {
        console.error('useOffers error:', err)
        // Fallback mock data
        setOffers([
          { id: '1', title: '30% Off Shirts', description: 'Valid on all shirts', points_cost: 500, category: 'discount', valid_until: '2024-12-31' },
          { id: '2', title: 'Double Points', description: 'Earn 2x points', points_cost: 0, category: 'bonus', valid_until: '2024-12-31' },
          { id: '3', title: 'Free Gift', description: 'With purchase over 5000', points_cost: 300, category: 'gift', valid_until: '2024-12-31' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [])

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
