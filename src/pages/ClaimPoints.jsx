import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hourglass, CheckCircle2, XCircle } from 'lucide-react'
import useUserStore from '../store/userStore'
import { supabase } from '../lib/supabase'

const CLAIM_EXPIRY_MINUTES = 10

export default function ClaimPoints() {
  const { storeSlug } = useParams()
  const navigate = useNavigate()
  const { user, membership, refreshMembership } = useUserStore()
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [claimStatus, setClaimStatus] = useState('loading')
  const [claimDetails, setClaimDetails] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [timeLeft, setTimeLeft] = useState(CLAIM_EXPIRY_MINUTES * 60)

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('slug', storeSlug)
          .single()

        if (error) throw error
        setStore(data)
      } catch (err) {
        console.error('Error fetching store:', err)
        setErrorMessage('المتجر غير موجود')
        setClaimStatus('error')
      } finally {
        setLoading(false)
      }
    }
    fetchStore()
  }, [storeSlug])

  useEffect(() => {
    if (!store?.id || !user?.id || !membership?.id || claimStatus !== 'loading') return

    const initClaim = async () => {
      try {
        const { data: existing } = await supabase
          .from('pending_point_claims')
          .select('*')
          .eq('user_id', user.id)
          .eq('store_id', store.id)
          .in('status', ['waiting', 'claimed'])
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (existing) {
          setClaimDetails(existing)
          setClaimStatus(existing.status)
          return
        }

        const expiresAt = new Date(Date.now() + CLAIM_EXPIRY_MINUTES * 60 * 1000)
        
        const { data: newClaim, error } = await supabase
          .from('pending_point_claims')
          .insert({
            store_id: store.id,
            user_id: user.id,
            membership_id: membership.id,
            status: 'waiting',
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single()

        if (error) throw error
        setClaimDetails(newClaim)
        setClaimStatus('waiting')
      } catch (err) {
        console.error('Error creating claim:', err)
        setErrorMessage('فشل في إنشاء الطلب')
        setClaimStatus('error')
      }
    }
    initClaim()
  }, [store?.id, user?.id, membership?.id])

  useEffect(() => {
    if (!claimDetails?.id || claimStatus !== 'waiting') return

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('pending_point_claims')
        .select('*')
        .eq('id', claimDetails.id)
        .single()

      if (data?.status === 'claimed') {
        refreshMembership()
        navigate('/claim-success', {
          state: {
            points: data.points_claimed,
            amount: data.amount_claimed,
            storeName: store?.name,
          },
        })
      }

      if (data?.status === 'expired' || new Date(data?.expires_at) < new Date()) {
        setClaimStatus('expired')
      }

      const remaining = Math.max(0, Math.floor((new Date(data?.expires_at) - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        setClaimStatus('expired')
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [claimDetails?.id, claimStatus, store?.name])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const renderContent = () => {
    switch (claimStatus) {
      case 'loading':
        return (
          <div className="text-center">
            <p className="text-lg text-muted mb-4">جاري معالجة طلبك...</p>
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )
      case 'waiting':
        return (
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            >
              <Hourglass size={64} className="text-accent mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-text mb-2">أنت في طابور الانتظار!</h2>
            <p className="text-muted mb-6">
              لقد قمت بمسح كود الباب لـ {store?.name}. في انتظار تأكيد التاجر لعملية الشراء...
            </p>
            <p className="text-sm text-muted mb-2">ينتهي الطلب في:</p>
            <p className={`text-xl font-mono font-bold mb-6 ${timeLeft < 60 ? 'text-red-500' : 'text-accent'}`}>
              {formatTime(timeLeft)}
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted underline"
            >
              الذهاب للرئيسية
            </button>
          </div>
        )
      case 'claimed':
        return (
          <div className="text-center">
            <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text mb-2">تم استلام النقاط!</h2>
            <p className="text-muted mb-6">لقد استلمت نقاطك بنجاح.</p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-8 px-6 py-3 bg-accent text-white font-bold rounded-2xl shadow-lg"
            >
              عرض نقاطك
            </button>
          </div>
        )
      case 'expired':
        return (
          <div className="text-center">
            <XCircle size={64} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text mb-2">انتهت صلاحية الطلب</h2>
            <p className="text-muted mb-6">انتهت صلاحية طلبك. يرجى مسح كود الباب مرة أخرى.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 px-6 py-3 bg-accent text-white font-bold rounded-2xl shadow-lg"
            >
              حاول مرة أخرى
            </button>
          </div>
        )
      case 'error':
        return (
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">خطأ</h2>
            <p className="text-muted mb-6">{errorMessage || 'حدث خطأ غير متوقع.'}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-8 px-6 py-3 bg-accent text-white font-bold rounded-2xl shadow-lg"
            >
              الذهاب للرئيسية
            </button>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-surface p-5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">المتجر غير موجود</p>
          <button onClick={() => navigate('/')} className="text-accent">الذهاب للرئيسية</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-light to-white flex items-center justify-center p-5">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center"
      >
        {renderContent()}
      </motion.div>
    </div>
  )
}
