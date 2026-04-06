import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import useUserStore from '../store/userStore'

const CLAIM_EXPIRY_MINUTES = 10

export const usePendingClaim = (storeId) => {
  const { user, membership } = useUserStore()
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClaim = useCallback(async () => {
    if (!user?.id || !storeId) return

    try {
      const { data, error: err } = await supabase
        .from('pending_point_claims')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .in('status', ['waiting', 'claimed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (err && err.code !== 'PGRST116') throw err
      setClaim(data || null)
    } catch (err) {
      console.error('usePendingClaim fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, storeId])

  useEffect(() => {
    fetchClaim()
  }, [fetchClaim])

  const createClaim = useCallback(async () => {
    if (!user?.id || !membership?.id || !storeId) {
      throw new Error('Missing required data')
    }

    const expiresAt = new Date(Date.now() + CLAIM_EXPIRY_MINUTES * 60 * 1000)

    const { data, error: err } = await supabase
      .from('pending_point_claims')
      .insert({
        store_id: storeId,
        user_id: user.id,
        membership_id: membership.id,
        status: 'waiting',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (err) throw err
    setClaim(data)
    return data
  }, [user?.id, membership?.id, storeId])

  const checkExistingClaim = useCallback(async () => {
    if (!user?.id || !storeId) return null

    const { data, error: err } = await supabase
      .from('pending_point_claims')
      .select('*')
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .eq('status', 'waiting')
      .gte('expires_at', new Date().toISOString())
      .single()

    if (err && err.code !== 'PGRST116') throw err
    return data || null
  }, [user?.id, storeId])

  const claimPoints = useCallback(async (amount, points) => {
    if (!claim?.id) return

    const { data, error: err } = await supabase
      .from('pending_point_claims')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        amount_claimed: amount,
        points_claimed: points,
      })
      .eq('id', claim.id)
      .select()
      .single()

    if (err) throw err
    setClaim(data)
    return data
  }, [claim?.id])

  return {
    claim,
    loading,
    error,
    createClaim,
    checkExistingClaim,
    claimPoints,
    refetch: fetchClaim,
  }
}

export const useWaitingCustomers = (storeId) => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWaiting = useCallback(async () => {
    if (!storeId) return

    try {
      const { data, error: err } = await supabase
        .from('pending_point_claims')
        .select('*, users(*), user_store_memberships(*)')
        .eq('store_id', storeId)
        .eq('status', 'waiting')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })

      if (err) throw err
      setCustomers(data || [])
    } catch (err) {
      console.error('useWaitingCustomers fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchWaiting()

    const channel = supabase
      .channel('waiting_customers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pending_point_claims',
        filter: `store_id=eq.${storeId}`,
      }, () => {
        fetchWaiting()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, fetchWaiting])

  const assignPointsToCustomer = useCallback(async (claimId, amount, points) => {
    try {
      const { data: claim, error: claimErr } = await supabase
        .from('pending_point_claims')
        .select('*')
        .eq('id', claimId)
        .single()

      if (claimErr) throw claimErr
      if (!claim) throw new Error('Claim not found')

      const { error: updateErr } = await supabase
        .from('pending_point_claims')
        .update({
          status: 'claimed',
          claimed_at: new Date().toISOString(),
          amount_claimed: amount,
          points_claimed: points,
        })
        .eq('id', claimId)

      if (updateErr) throw updateErr

      const newPoints = claim.user_store_memberships?.points + points
      await supabase
        .from('user_store_memberships')
        .update({ points: newPoints })
        .eq('id', claim.membership_id)

      await supabase.from('transactions').insert({
        user_id: claim.user_id,
        store_id: storeId,
        membership_id: claim.membership_id,
        type: 'earn',
        points,
        amount,
        note: 'Door QR - First scanner wins',
      })

      await fetchWaiting()
      return { success: true, claim }
    } catch (err) {
      console.error('assignPointsToCustomer error:', err)
      throw err
    }
  }, [storeId, fetchWaiting])

  const expireClaim = useCallback(async (claimId) => {
    const { error: err } = await supabase
      .from('pending_point_claims')
      .update({ status: 'expired' })
      .eq('id', claimId)

    if (err) throw err
    await fetchWaiting()
  }, [fetchWaiting])

  const clearAllWaiting = useCallback(async () => {
    const { error: err } = await supabase
      .from('pending_point_claims')
      .update({ status: 'expired' })
      .eq('store_id', storeId)
      .eq('status', 'waiting')

    if (err) throw err
    await fetchWaiting()
  }, [storeId, fetchWaiting])

  return {
    customers,
    loading,
    error,
    assignPointsToCustomer,
    expireClaim,
    clearAllWaiting,
    refetch: fetchWaiting,
  }
}
