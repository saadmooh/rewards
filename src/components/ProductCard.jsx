import { motion } from 'framer-motion'
import { formatCurrency } from '../lib/offers'

export default function ProductCard({
  name,
  price,
  original_price,
  imageUrl,
  isExclusive = false,
  onClick,
}) {
  const hasDiscount = original_price && original_price > price;

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
        <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded-lg text-xs font-bold text-gray-900 flex flex-col items-end">
          {hasDiscount && (
            <span className="text-[10px] text-gray-400 line-through leading-none mb-0.5">
              {formatCurrency(original_price)}
            </span>
          )}
          <span>{formatCurrency(price)}</span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-text font-semibold text-sm truncate">{name}</h3>
      </div>
    </motion.article>
  )
}
