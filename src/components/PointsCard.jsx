import { motion } from 'framer-motion'
import TierBadge from './TierBadge'

const tierConfig = {
  bronze: { min: 0, max: 999 },
  silver: { min: 1000, max: 4999 },
  gold: { min: 5000, max: 9999 },
  platinum: { min: 10000, max: Infinity },
}

export default function PointsCard({ points = 0, tier = 'bronze' }) {
  const tierKey = tier?.toLowerCase() || 'bronze'
  const currentTier = tierConfig[tierKey] || tierConfig.bronze
  
  const nextTierKey = { bronze: 'silver', silver: 'gold', gold: 'platinum', platinum: null }[tierKey]
  const nextTier = nextTierKey ? tierConfig[nextTierKey] : null
  
  const progress = nextTier 
    ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl p-6 shadow-card"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-muted text-sm">Your Points</p>
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

      {nextTier && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted mb-2">
            <span>Progress to {nextTierKey}</span>
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
              ? `${(nextTier.min - points).toLocaleString()} points to ${nextTierKey}`
              : '🎉 Max tier reached!'}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
          <span className="text-accent text-sm">👤</span>
        </div>
        <p className="text-sm text-muted">
          Ahmed Benali • <span className="text-accent">Member since Jan 2024</span>
        </p>
      </div>
    </motion.div>
  )
}
