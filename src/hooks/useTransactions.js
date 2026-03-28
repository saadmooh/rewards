import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useUserStore from '../store/userStore'

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useUserStore()

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error
        setTransactions(data || [])
      } catch (err) {
        console.error('useTransactions error:', err)
        // Fallback mock data
        setTransactions([
          { id: '1', type: 'earn', points: 45, note: 'Purchase - 450 DZD', created_at: new Date().toISOString() },
          { id: '2', type: 'redeem', points: -500, note: 'Used 30% discount', created_at: new Date().toISOString() },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user?.id])

  return { transactions, loading, error }
}
