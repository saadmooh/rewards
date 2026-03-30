import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useUserStore from '../store/userStore'

export const useOffers = () => {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { store } = useUserStore()

  useEffect(() => {
    const fetchOffers = async () => {
      try {
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
        setOffers(data || [])
      } catch (err) {
        console.error('useOffers error:', err)
        setOffers([])
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [store?.id])

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
