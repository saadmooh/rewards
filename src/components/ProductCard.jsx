import { motion } from 'framer-motion'

export default function ProductCard({
  id,
  name,
  price,
  imageUrl,
  isExclusive = false,
  onClick,
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, shadow: '0 12px 24px -4px rgb(0 0 0 / 0.15)' }}
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-card cursor-pointer"
    >
      <div className="relative h-36">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
        {isExclusive && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-2xl">🔒</span>
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded-lg text-xs font-bold text-accent">
          ${price}
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-text font-semibold text-sm truncate">{name}</h3>
      </div>
    </motion.article>
  )
}
