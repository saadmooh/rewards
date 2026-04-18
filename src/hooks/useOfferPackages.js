import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useOfferPackages = (userId, storeId) => {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId || !storeId) {
      setLoading(false)
      return
    }
    fetchPackages()
  }, [userId, storeId])

  const fetchPackages = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('offer_package_claims')
        .select(`
          *,
          offer_packages (
            id,
            title,
            description,
            icon,
            reward_type,
            reward_value,
            reward_items,
            min_wait_hours
          )
        `)
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .eq('is_opened', false)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setPackages(data || [])
    } catch (err) {
      console.error('Error fetching packages:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openPackage = async (claimId) => {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      
      const { data, error: updateError } = await supabase
        .from('offer_package_claims')
        .update({
          is_opened: true,
          opened_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .eq('id', claimId)
        .select(`
          *,
          offer_packages (
            id,
            title,
            reward_type,
            reward_value
          )
        `)
        .single()

      if (updateError) throw updateError

      setPackages(prev => prev.filter(p => p.id !== claimId))
      return data
    } catch (err) {
      console.error('Error opening package:', err)
      return null
    }
  }

  const claimPackage = async (packageId) => {
    try {
      const { data, error: insertError } = await supabase
        .from('offer_package_claims')
        .insert({
          package_id: packageId,
          user_id: userId,
          store_id: storeId,
        })
        .select()
        .single()

      if (insertError) throw insertError
      await fetchPackages()
      return data
    } catch (err) {
      console.error('Error claiming package:', err)
      return null
    }
  }

  return {
    packages,
    loading,
    error,
    openPackage,
    claimPackage,
    refetch: fetchPackages,
  }
}