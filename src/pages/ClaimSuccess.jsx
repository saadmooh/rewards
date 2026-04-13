import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Gift } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useUserStore from '../store/userStore'

export default function ClaimSuccess() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { membership } = useUserStore()

  const { points, amount, storeName } = useMemo(() => ({
    points: location.state?.points || 0,
    amount: location.state?.amount || 0,
    storeName: location.state?.storeName || '',
  }), [location.state])

  const storeLabel = t('claim_success.from_store', { store: storeName })

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-light to-white p-5">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        className="max-w-md mx-auto text-center py-12"
      >
        <div className="relative w-32 h-32 mx-auto mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="absolute inset-0 bg-white rounded-full shadow-lg flex items-center justify-center"
          >
            <CheckCircle2 size={64} className="text-green-500" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="absolute -top-2 -right-2 w-10 h-10 bg-accent rounded-full flex items-center justify-center shadow-lg"
          >
            <Gift size={20} className="text-white" />
          </motion.div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-text mb-2"
        >
          {t('claim_success.title')}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted mb-6"
        >
          {storeLabel}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl p-6 shadow-card mb-6"
        >
          <p className="text-sm text-muted mb-2">{t('claim_success.earned_points')}</p>
          <p className="text-4xl font-black text-accent mb-4">+{points}</p>
          <p className="text-sm text-muted">
            {t('claim_success.total')}: <span className="font-bold text-text">{membership?.points || 0}</span> {t('common.points')}
          </p>
          {amount > 0 && (
            <p className="text-xs text-muted mt-2">{t('claim_success.purchase_amount', { amount: amount.toLocaleString() })}</p>
          )}
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="px-10 py-4 bg-accent text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
        >
          {t('claim_success.awesome')}
        </motion.button>
      </motion.div>
    </div>
  )
}
