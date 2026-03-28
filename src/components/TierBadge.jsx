import { motion } from 'framer-motion'

const tierConfig = {
  bronze: { label: 'Bronze', color: '#f59e0b', bg: '#fef3c7', icon: '🥉' },
  silver: { label: 'Silver', color: '#64748b', bg: '#f1f5f9', icon: '🥈' },
  gold: { label: 'Gold', color: '#eab308', bg: '#fef9c3', icon: '🥇' },
  platinum: { label: 'Platinum', color: '#8b5cf6', bg: '#ede9fe', icon: '💎' },
}

export default function TierBadge({ tier = 'bronze', size = 'medium' }) {
  const config = tierConfig[tier?.toLowerCase()] || tierConfig.bronze
  
  const sizes = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-3 py-1',
    large: 'text-sm px-4 py-2',
  }

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizes[size]}`}
      style={{ 
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </motion.span>
  )
}
