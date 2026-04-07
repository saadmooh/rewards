import { useState } from 'react'
import { motion } from 'framer-motion'
import useUserStore from '../store/userStore'
import TierBadge from '../components/TierBadge'

const tiers = [
  { id: 'bronze', name: 'برونزي', perks: ['مكافآت أساسية', 'نقاط على كل عملية شراء'] },
  { id: 'silver', name: 'فضي', perks: ['جميع مزايا البرونزي', 'عروض حصرية', 'نقاط مضاعفة'] },
  { id: 'gold', name: 'ذهبي', perks: ['جميع مزايا الفضي', 'عروض سريعة مبكراً', 'هدية عيد الميلاد'] },
  { id: 'platinum', name: 'بلاتيني', perks: ['جميع مزايا الذهبي', 'منتجات حصرية', 'أولوية'] },
]

export default function Onboarding() {
  const [birthDate, setBirthDate] = useState('')
  const { user, initUser } = useUserStore()

  const handleSubmit = (e) => {
    e.preventDefault()
    initUser({
      ...user,
      birth_date: birthDate,
      full_name: `${user?.first_name || 'User'} ${user?.last_name || ''}`.trim(),
      points: user?.points || 100,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-white p-5">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 pt-8"
      >
        <div className="w-20 h-20 bg-accent-light rounded-3xl flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">👕</span>
        </div>
        <h1 className="text-3xl font-bold text-text mb-2">أهلاً بك! 👋</h1>
        <p className="text-muted">أكمل ملفك الشخصي لتبدأ</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
      >
        <div className="bg-white rounded-3xl p-6 mb-6 shadow-card">
          <label className="block text-text font-semibold mb-2">
            🎂 عيد الميلاد (اختياري)
          </label>
          <p className="text-muted text-sm mb-4">
            أضف عيد ميلادك واحصل على 50 نقطة إضافية + عروض خاصة!
          </p>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full p-4 bg-surface border border-border rounded-2xl text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full py-5 bg-accent text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all mb-6"
        >
          ابدأ 🚀
        </motion.button>

        <div className="bg-white rounded-3xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-text mb-4">مستويات العضوية</h2>
          <div className="space-y-4">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <TierBadge tier={tier.id} size="small" />
                <div>
                  <p className="text-text font-semibold">{tier.name}</p>
                  <p className="text-muted text-xs">{tier.perks.join(' • ')}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.form>
    </div>
  )
}
