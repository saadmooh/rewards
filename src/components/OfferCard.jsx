import { motion } from 'framer-motion'

const categoryColors = {
  discount: '#10b981',
  bonus: '#f59e0b',
  gift: '#ec4899',
  exclusive: '#8b5cf6',
}

export default function OfferCard({
  title,
  description,
  points,
  expiresAt,
  imageUrl,
  category,
  onClick,
}) {
  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const catColor = categoryColors[category?.toLowerCase()] || '#64748b'

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-card cursor-pointer"
    >
      {imageUrl && (
        <div className="relative h-32">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          {category && (
            <span
              className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: catColor }}
            >
              {category}
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-text font-bold text-base line-clamp-1">{title}</h3>
          {points > 0 && (
            <span className="px-2 py-1 bg-accent-light text-accent-dark rounded-full text-xs font-bold whitespace-nowrap">
              {points} pts
            </span>
          )}
        </div>

        <p className="text-muted text-sm mb-3 line-clamp-2">{description}</p>

        {expiresAt && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>⏰</span>
            <span>Expires {formatDate(expiresAt)}</span>
          </div>
        )}
      </div>
    </motion.article>
  )
}
