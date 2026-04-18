import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useScratchCards = (userId, storeId) => {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId || !storeId) {
      setLoading(false)
      return
    }
    fetchAvailableCards()
  }, [userId, storeId])

  const fetchAvailableCards = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('scratch_card_claims')
        .select(`
          *,
          scratch_cards (
            id,
            title,
            description,
            reward_type,
            reward_value,
            reward_metadata,
            package_id,
            surface_color,
            status,
            valid_until
          )
        `)
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .eq('is_revealed', false)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setCards(data || [])
    } catch (err) {
      console.error('Error fetching scratch cards:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const revealCard = async (claimId) => {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      
      const { data, error: updateError } = await supabase
        .from('scratch_card_claims')
        .update({
          is_revealed: true,
          revealed_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .eq('id', claimId)
        .select(`
          *,
          scratch_cards (
            id,
            title,
            reward_type,
            reward_value,
            reward_metadata,
            package_id
          )
        `)
        .single()

      if (updateError) throw updateError

      setCards(prev => prev.filter(c => c.id !== claimId))
      return data
    } catch (err) {
      console.error('Error revealing card:', err)
      setError(err.message)
      return null
    }
  }

  const redeemCard = async (claimId) => {
    try {
      const { data: claim, error: fetchError } = await supabase
        .from('scratch_card_claims')
        .select(`
          *,
          scratch_cards (
            reward_type,
            reward_value,
            reward_metadata,
            package_id
          )
        `)
        .eq('id', claimId)
        .single()

      if (fetchError) throw fetchError
      if (!claim?.scratch_cards) throw new Error('Card not found')

      const { reward_type, reward_value, package_id } = claim.scratch_cards

      if (reward_type === 'points' || reward_type === 'double_points') {
        const pointsToAdd = reward_type === 'double_points' 
          ? reward_value * 2 
          : reward_value

        await supabase.rpc('add_points', {
          p_user_id: userId,
          p_store_id: storeId,
          p_points: pointsToAdd,
        })
      } else if (reward_type === 'package' && package_id) {
        // Create an offer package claim
        const { error: packageError } = await supabase
          .from('offer_package_claims')
          .insert({
            package_id: package_id,
            user_id: userId,
            store_id: storeId,
          })
        
        if (packageError) throw packageError
      }

      const { error: updateError } = await supabase
        .from('scratch_card_claims')
        .update({ is_redeemed: true })
        .eq('id', claimId)

      if (updateError) throw updateError

      return { success: true, rewardType: reward_type, rewardValue: reward_value }
    } catch (err) {
      console.error('Error redeeming card:', err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const createClaim = async (cardId) => {
    try {
      const { data, error: insertError } = await supabase
        .from('scratch_card_claims')
        .insert({
          card_id: cardId,
          user_id: userId,
          store_id: storeId,
        })
        .select()
        .single()

      if (insertError) throw insertError
      await fetchAvailableCards()
      return data
    } catch (err) {
      console.error('Error creating claim:', err)
      setError(err.message)
      return null
    }
  }

  return {
    cards,
    loading,
    error,
    revealCard,
    redeemCard,
    createClaim,
    refetch: fetchAvailableCards,
  }
}