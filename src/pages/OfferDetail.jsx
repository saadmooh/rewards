import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import useUserStore from '../store/userStore'
import { useOfferWithProducts } from '../hooks/useOfferWithProducts'
import OfferProductList from '../components/OfferProductList'
import { formatCurrency } from '../lib/offers'

const OFFER_COUPON_EXPIRY_SECONDS = 86400

export default function OfferDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { redeemOffer, membership } = useUserStore()
  const { offer, products, activeRedemption, loading: offerLoading, error: offerError, userTierLevel } = useOfferWithProducts(id)
  const [showConfirm, setShowConfirm] = useState(false)
  const [redeemed, setRedeemed] = useState(false)
  const [coupon, setCoupon] = useState(null)
  const [couponExpiry, setCouponExpiry] = useState(null)
  const timerRef = useRef(null)
  const [timeLeft, setTimeLeft] = useState(OFFER_COUPON_EXPIRY_SECONDS)

  const tierNames = { bronze: 'برونزي', silver: 'فضي', gold: ذهبي, platinum: 'بلاتيني' }
  const isTierRestricted = offer?.tier_restricted === true

  // Synchronize with active redemption from hook
  useEffect(() => {
    if (activeRedemption) {
      setCoupon(activeRedemption.coupon_code)
      setRedeemed(true)
      const expiry = new Date(activeRedemption.expires_at)
      setCouponExpiry(expiry)
      const secondsLeft = Math.max(0, Math.floor((expiry.getTime() - Date.now()) / 1000))
      setTimeLeft(secondsLeft)
    }
  }, [activeRedemption])

  const handleRedeem = async () => {
    if (!offer) return
    setShowConfirm(true)
  }

  const confirmRedeem = async () => {
    const result = await redeemOffer(offer.id, offer.points_cost || 0)
    if (result?.coupon_code) {
      setCoupon(result.coupon_code)
      setRedeemed(true)
      const expiry = new Date(Date.now() + OFFER_COUPON_EXPIRY_SECONDS * 1000)
      setCouponExpiry(expiry)
      setTimeLeft(OFFER_COUPON_EXPIRY_SECONDS)
    }
    setShowConfirm(false)
  }

  useEffect(() => {
    if (!redeemed || !couponExpiry) return
    
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timerRef.current)
  }, [redeemed, couponExpiry])

  const formatTime = (s) => {
    const hours = Math.floor(s / 3600)
    const mins = Math.floor((s % 3600) / 60)
    const secs = s % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m ${secs}s`
  }

  if (offerLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (offerError || !offer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">العرض غير موجود</p>
          <button onClick={() => navigate(-1)} className="text-gray-600 font-medium">العودة</button>
        </div>
      </div>
    )
  }

  if (isTierRestricted) {
    return (
      <div className="min-h-screen bg-white p-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mb-6 transition-colors hover:bg-gray-200"
        >
          ←
        </button>
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">محتوى حصري</h2>
          <p className="text-gray-500 font-medium mb-8">
            هذا العرض متاح فقط لأعضاء فئة <span className="text-accent font-black">{tierNames[offer.required_tier] || offer.required_tier}</span> فأعلى
          </p>
          <div className="bg-gray-50 rounded-2xl p-6 border border-border">
            <p className="text-gray-400 text-sm mb-4">حالياً أنت في فئة</p>
            <p className="text-3xl font-black text-gray-700 capitalize">{membership?.tier || 'برونزي'}</p>
          </div>
          <p className="text-gray-400 text-xs mt-6">اجمعي المزيد من النقاط للترقية!</p>
          <button
            onClick={() => navigate('/')}
            className="mt-8 w-full py-4 bg-gray-900 text-white font-black rounded-2xl"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    )
  }

  if (redeemed && coupon) {
    return (
      <div className="min-h-screen bg-white p-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="max-w-2xl mx-auto text-center py-10"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">تم تفعيل العرض!</h2>
          <p className="text-gray-500 mb-8 font-medium">{offer.title}</p>
          
          <div className="bg-gray-50 rounded-3xl p-8 mb-8 border border-border shadow-soft max-w-sm mx-auto">
            <div className="flex justify-center mb-6 p-4 bg-white rounded-2xl shadow-inner">
              <QRCodeCanvas value={coupon} size={200} level="H" includeMargin={false} />
            </div>
            <p className="text-3xl font-mono font-black text-gray-900 tracking-[0.2em] mb-2">{coupon}</p>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">أظهر هذا للكاشير</p>
            <div className="mt-6 pt-6 border-t border-gray-200">
               <p className="text-red-500 text-xs font-black uppercase tracking-tighter">ينتهي في {formatTime(timeLeft)}</p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/offers')}
            className="px-12 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95"
          >
            تم
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-5">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mb-6 transition-colors hover:bg-gray-200"
        >
          ←
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="aspect-video md:aspect-square bg-gray-100 rounded-3xl overflow-hidden shadow-soft border border-border flex items-center justify-center"
          >
             <span className="text-6xl opacity-20">🎁</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 text-right"
          >
            <div>
              <span className="px-4 py-1.5 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-soft shadow-accent/20">
                {offer.type}
              </span>
              
              <h1 className="text-3xl font-black text-gray-900 mt-4 mb-3 tracking-tight">
                {offer.title}
              </h1>
              
              <p className="text-gray-500 font-medium leading-relaxed">
                {offer.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-gray-50 p-4 rounded-2xl border border-border">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">النقاط المطلوبة</p>
                  <p className="text-accent text-xl font-black">{offer.points_cost ? `${offer.points_cost.toLocaleString()} نقطة` : 'مجاني'}</p>
               </div>
               <div className="bg-gray-50 p-4 rounded-2xl border border-border">
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">صلاحية العرض</p>
                  <p className="text-gray-700 text-lg font-black">
                    {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('ar-DZ') : 'دائم'}
                  </p>
               </div>
            </div>

            {offer.discount_percent && (
              <div className="bg-green-50 rounded-2xl p-5 border border-green-100 flex items-center justify-between">
                <span className="text-green-700 font-black text-2xl">-{offer.discount_percent}%</span>
                <p className="text-green-800 font-bold">خصم خاص مفعل</p>
              </div>
            )}

            {products && products.length > 0 && (
              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">المنتجات المشمولة في العرض</h3>
                <OfferProductList products={products} />
              </div>
            )}
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleRedeem}
              className="w-full py-5 rounded-2xl font-black text-lg transition-all bg-gray-900 text-white shadow-xl shadow-gray-200 active:scale-95"
            >
              {offer.points_cost ? 'استبدال بالنقاط الآن' : 'تفعيل العرض مجاناً'}
            </motion.button>
          </motion.div>
        </div>

        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-5 max-w-sm w-full"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">تأكيد</h3>
              <p className="text-gray-500 text-sm mb-5">
                {offer.points_cost 
                  ? `هل تريد استخدام ${offer.points_cost} نقطة من رصيدك؟`
                  : 'هل تريد تفعيل هذا العرض؟'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmRedeem}
                  className="flex-1 py-3 bg-gray-900 text-white font-medium rounded-xl"
                >
                  تأكيد
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}