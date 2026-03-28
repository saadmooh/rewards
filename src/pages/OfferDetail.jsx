import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useUserStore from '../store/userStore'
import { useOffer } from '../hooks/useOffers'

export default function OfferDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, redeemOffer } = useUserStore()
  const { offer, loading } = useOffer(id)
  const [showConfirm, setShowConfirm] = useState(false)
  const [redeemed, setRedeemed] = useState(false)
  const [coupon, setCoupon] = useState(null)

  const handleRedeem = async () => {
    if (!offer) return
    
    const result = await redeemOffer(offer.id, offer.points_cost || 0)
    if (result) {
      const code = result.coupon_code
      setCoupon(code)
      setRedeemed(true)
    } else {
      setShowConfirm(true)
    }
  }

  const confirmRedeem = async () => {
    const result = await redeemOffer(offer.id, offer.points_cost || 0)
    if (result) {
      setCoupon(result.coupon_code)
      setRedeemed(true)
    }
    setShowConfirm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">Offer not found</p>
          <button onClick={() => navigate(-1)} className="text-accent">Go back</button>
        </div>
      </div>
    )
  }

  if (redeemed && coupon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-light to-white p-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="max-w-md mx-auto text-center py-12"
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-5xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">Offer Activated!</h2>
          <p className="text-muted mb-6">{offer.title}</p>
          
          <div className="bg-white rounded-3xl p-6 mb-6 shadow-card">
            <p className="text-muted text-sm mb-2">Show this code to the cashier</p>
            <p className="text-4xl font-mono font-bold text-accent tracking-wider">{coupon}</p>
          </div>

          <p className="text-muted text-sm mb-8">Valid for 24 hours</p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/offers')}
            className="px-10 py-4 bg-accent text-white font-bold rounded-2xl shadow-lg"
          >
            Done
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface p-5">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 mb-4"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl overflow-hidden shadow-card"
        >
          <div className="h-40 bg-gradient-to-br from-accent-light to-surface" />
          
          <div className="p-6">
            <span className="px-3 py-1 bg-accent-light text-accent-dark rounded-full text-xs font-semibold">
              {offer.type}
            </span>
            
            <h1 className="text-2xl font-bold text-text mt-3 mb-2">
              {offer.title}
            </h1>
            
            <p className="text-muted mb-6">
              {offer.description}
            </p>

            <div className="flex items-center justify-between text-sm mb-6">
              <div>
                <p className="text-muted">Points Required</p>
                <p className="text-text font-bold text-lg">{offer.points_cost || 'Free'}</p>
              </div>
              <div className="text-right">
                <p className="text-muted">Expires</p>
                <p className="text-text font-semibold">
                  {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRedeem}
              className="w-full py-4 rounded-2xl font-bold transition-all bg-accent text-white shadow-lg hover:shadow-xl"
            >
              {offer.points_cost ? 'Redeem Now' : 'Activate Offer'}
            </motion.button>
          </div>
        </motion.div>

        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full"
            >
              <h3 className="text-xl font-bold text-text mb-2">Confirm</h3>
              <p className="text-muted mb-6">
                {offer.points_cost 
                  ? `Use ${offer.points_cost} points from your balance?`
                  : 'Activate this offer?'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-surface text-text rounded-2xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRedeem}
                  className="flex-1 py-3 bg-accent text-white font-bold rounded-2xl"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
