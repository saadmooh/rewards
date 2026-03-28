import { useState } from 'react'
import { motion } from 'framer-motion'
import useUserStore from '../store/userStore'
import TierBadge from '../components/TierBadge'

export default function Profile() {
  const { user } = useUserStore()
  const [showReferral, setShowReferral] = useState(false)

  const copyReferral = () => {
    const link = `https://t.me/YourBot?start=ref_${user?.referral_code}`
    navigator.clipboard.writeText(link)
    setShowReferral(true)
    setTimeout(() => setShowReferral(false), 2000)
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="p-5 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-text">Profile</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 mb-6 shadow-card"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center overflow-hidden">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text">
                {user?.full_name || user?.first_name || 'User'}
              </h2>
              <TierBadge tier={user?.tier || 'bronze'} size="medium" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-muted text-xs">Username</p>
              <p className="text-text font-semibold">@{user?.username || 'unknown'}</p>
            </div>
            <div className="text-right">
              <p className="text-muted text-xs">Member since</p>
              <p className="text-text font-semibold">January 2024</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 mb-6 shadow-card"
        >
          <h3 className="text-lg font-bold text-text mb-2">🎁 Invite Friends</h3>
          <p className="text-muted text-sm mb-4">
            Share your code and earn 200 points for each friend who joins!
          </p>
          
          <div className="flex items-center gap-2 bg-surface rounded-2xl p-3">
            <code className="flex-1 text-accent-dark font-bold text-lg">
              {user?.referral_code || 'LOADING...'}
            </code>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyReferral}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                showReferral 
                  ? 'bg-success text-white' 
                  : 'bg-accent text-white'
              }`}
            >
              {showReferral ? 'Copied!' : 'Share'}
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 mb-6 shadow-card"
        >
          <h3 className="text-lg font-bold text-text mb-4">⚙️ Settings</h3>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-surface rounded-2xl">
              <span className="text-text font-medium">🎂 Birthday</span>
              <span className="text-muted text-sm">
                {user?.birth_date || 'Not set'}
              </span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 bg-surface rounded-2xl">
              <span className="text-text font-medium">🌐 Language</span>
              <span className="text-muted text-sm">العربية</span>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-card"
        >
          <h3 className="text-lg font-bold text-text mb-4">🎟️ Your Coupons</h3>
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🎟️</p>
            <p className="text-muted">No active coupons</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
