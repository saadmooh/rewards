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
  const { redeemOffer } = useUserStore()
  const { offer, products, activeRedemption, loading: offerLoading, error: offerError } = useOfferWithProducts(id)
  const [showConfirm, setShowConfirm] = useState(false)
  const [redeemed, setRedeemed] = useState(false)
  const [coupon, setCoupon] = useState(null)
  const [couponExpiry, setCouponExpiry] = useState(null)
  const timerRef = useRef(null)
  const [timeLeft, setTimeLeft] = useState(OFFER_COUPON_EXPIRY_SECONDS)

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

  if (redeemed && coupon) {
    return (
      <div className="min-h-screen bg-white p-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="max-w-md mx-auto text-center py-10"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">تم تفعيل العرض!</h2>
          <p className="text-gray-500 mb-5">{offer.title}</p>
          
          <div className="bg-gray-50 rounded-2xl p-5 mb-5">
            <div className="flex justify-center mb-4">
              <QRCodeCanvas value={coupon} size={160} level="H" includeMargin={false} />
            </div>
            <p className="text-2xl font-mono font-medium text-gray-900 tracking-wider mb-2">{coupon}</p>
            <p className="text-gray-400 text-sm">أظهر هذا للكاشير</p>
            <p className="text-gray-400 text-xs mt-2">ينتهي في {formatTime(timeLeft)}</p>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/offers')}
            className="px-8 py-3 bg-gray-900 text-white font-medium rounded-xl"
          >
            تم
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-5">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 mb-4 text-gray-600"
        >
          ←
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-2xl overflow-hidden"
        >
          <div className="h-32 bg-gray-100" />
          
          <div className="p-5">
            <span className="px-3 py-1 bg-gray-900 text-white rounded-full text-xs font-medium">
              {offer.type}
            </span>
            
            <h1 className="text-xl font-medium text-gray-900 mt-3 mb-2">
              {offer.title}
            </h1>
            
            <p className="text-gray-500 text-sm mb-6">
              {offer.description}
            </p>

            {offer.discount_percent && (
              <div className="bg-gray-100 rounded-xl p-3 mb-4">
                <p className="text-gray-900 font-medium text-center">
                  {offer.discount_percent}% خصم
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm mb-6">
              <div>
                <p className="text-gray-400 text-xs">النقاط المطلوبة</p>
                <p className="text-gray-900 font-medium">{offer.points_cost ? `${offer.points_cost} نقطة` : 'مجاني'}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">ينتهي</p>
                <p className="text-gray-600 font-medium">
                  {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>

            {products && products.length > 0 && (
              <div className="mb-6 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">المنتجات المشمولة</h3>
                <OfferProductList products={products} />
              </div>
            )}
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleRedeem}
              className="w-full py-3 rounded-xl font-medium transition-all bg-gray-900 text-white"
            >
              {offer.points_cost ? 'استبدال الآن' : 'تفعيل العرض'}
            </motion.button>
          </div>
        </motion.div>

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