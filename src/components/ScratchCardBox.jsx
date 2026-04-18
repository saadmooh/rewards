import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import useUserStore from '../store/userStore'
import { useScratchCards } from '../hooks/useScratchCards'
import { Sparkles, ChevronRight } from 'lucide-react'

export default function ScratchCardBox() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, store } = useUserStore()
  const { cards, loading } = useScratchCards(user?.id, store?.id)

  if (loading || !cards?.length) return null

  const count = cards.length
  const firstCard = cards[0]?.scratch_cards

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/scratch')}
      className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-5 shadow-lg shadow-purple-200 cursor-pointer group"
    >
      {/* Decorative circles */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner border border-white/30 group-hover:scale-110 transition-transform duration-300">
          🎁
        </div>
        
        <div className="flex-1 text-white">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-lg tracking-tight">
              {t('scratch_card.title')}
            </h3>
            <span className="bg-white/20 backdrop-blur-md text-[10px] font-black px-2 py-0.5 rounded-full border border-white/20 uppercase">
              {count} {count === 1 ? t('common.card') : t('common.cards')}
            </span>
          </div>
          <p className="text-white/80 text-xs font-medium mt-0.5">
            {firstCard?.title || t('scratch_card.subtitle')}
          </p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
          <ChevronRight size={20} />
        </div>
      </div>

      {/* Animated sparkles */}
      <motion.div
        animate={{ 
          opacity: [0.4, 1, 0.4],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute top-2 right-12 text-white/40"
      >
        <Sparkles size={16} />
      </motion.div>
    </motion.div>
  )
}
