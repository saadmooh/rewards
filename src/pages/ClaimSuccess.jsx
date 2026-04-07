import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Gift } from 'lucide-react'
import useUserStore from '../store/userStore'

export default function ClaimSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const { membership } = useUserStore()

  const { points, amount, storeName } = useMemo(() => ({
    points: location.state?.points || 0,
    amount: location.state?.amount || 0,
    storeName: location.state?.storeName || 'المتجر',
  }), [location.state])

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
          تم اكتساب النقاط!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted mb-6"
        >
          لقد كسبت نقاطًا من {storeName}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl p-6 shadow-card mb-6"
        >
          <p className="text-sm text-muted mb-2">النقاط المكتسبة</p>
          <p className="text-4xl font-black text-accent mb-4">+{points}</p>
          <p className="text-sm text-muted">
            الإجمالي: <span className="font-bold text-text">{membership?.points || 0}</span> نقطة
          </p>
          {amount > 0 && (
            <p className="text-xs text-muted mt-2">من عملية الشراء: {amount.toLocaleString()} دج</p>
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
          رائع!
        </motion.button>
      </motion.div>
    </div>
  )
}
