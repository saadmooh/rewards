import { motion } from 'framer-motion'
import useUserStore from '../store/userStore'
import TierBadge from './TierBadge'

export default function PointsCard() {
  const { membership, store, user } = useUserStore()

  const points = membership?.points || 0
  const tier = membership?.tier || 'bronze'
  
  // Normalize tier config to handle both { bronze: 0 } and { bronze: { min: 0 } }
  const rawTierConfig = store?.tier_config || {
    bronze: 0,
    silver: 1000,
    gold: 5000,
    platinum: 10000,
  }

  const tierConfig = {}
  Object.keys(rawTierConfig).forEach(key => {
    const val = rawTierConfig[key]
    tierConfig[key] = typeof val === 'number' ? { min: val } : val
  })

  const tierKey = tier?.toLowerCase() || 'bronze'
  const currentTier = tierConfig[tierKey] || tierConfig.bronze || { min: 0 }

  const nextTierKey = { bronze: 'silver', silver: 'gold', gold: 'platinum', platinum: null }[tierKey]
  const nextTier = nextTierKey ? tierConfig[nextTierKey] : null

  const progress = (nextTier && nextTier.min !== undefined)
    ? ((points - (currentTier.min || 0)) / (nextTier.min - (currentTier.min || 0))) * 100
    : 100

  const joinedDate = membership?.joined_at
    ? new Date(membership.joined_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })
    : 'Recently'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl p-6 shadow-card"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-muted text-sm">نقاطك</p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-4xl font-extrabold text-text mt-1"
          >
            {points.toLocaleString()}
          </motion.p>
        </div>
        <TierBadge tier={tier} size="large" />
      </div>

      {nextTier && nextTier.min !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted mb-2">
            <span>التقدم إلى {nextTierKey}</span>
            <span>{points.toLocaleString()} / {nextTier.min.toLocaleString()}</span>
          </div>
          <div className="h-3 bg-surface rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-accent to-accent-dark rounded-full"
            />
          </div>
          <p className="text-xs text-muted mt-2 text-center">
            {nextTier.min - points > 0
              ? `${(nextTier.min - points).toLocaleString()} نقطة حتى ${nextTierKey === 'silver' ? 'الفضي' : nextTierKey === 'gold' ? 'الذهبي' : nextTierKey === 'platinum' ? 'البلاتيني' : nextTierKey}`
              : '🎉 reached!'}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
          <span className="text-accent text-sm">👤</span>
        </div>
        <p className="text-sm text-muted">
          {user?.full_name || 'عضو'} • <span className="text-accent">عضو منذ {joinedDate}</span>
        </p>
      </div>
    </motion.div>
  )
}
