import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useUserStore from '../store/userStore'
import TierBadge from '../components/TierBadge'

export default function Profile() {
  const { user, membership, store, updateBirthDate } = useUserStore()
  const [showReferral, setShowReferral] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(user?.birth_date || '')

  const copyReferral = () => {
    const botUsername = store?.bot_username || 'YourBot'
    const referralCode = membership?.referral_code || ''
    const link = `https://t.me/${botUsername}?start=ref_${referralCode}`
    navigator.clipboard.writeText(link)
    setShowReferral(true)
    setTimeout(() => setShowReferral(false), 2000)
  }

  const handleSaveBirthDate = async () => {
    await updateBirthDate(selectedDate)
    setShowDatePicker(false)
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="p-5 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-xl font-medium text-gray-900">الملف الشخصي</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center overflow-hidden">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl text-gray-500">👤</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {user?.full_name || user?.first_name || 'مستخدم'}
              </h2>
              <TierBadge tier={membership?.tier || 'bronze'} size="medium" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-muted text-xs">اسم المستخدم</p>
              <p className="text-text font-semibold">@{user?.username || 'unknown'}</p>
            </div>
            <div className="text-right">
              <p className="text-muted text-xs">عضو منذ</p>
              <p className="text-text font-semibold">يناير 2024</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 mb-6 shadow-card"
        >
          <h3 className="text-lg font-bold text-text mb-2">🎁 دعوة الأصدقاء</h3>
          <p className="text-muted text-sm mb-4">
            شارك رمزك واكسب 200 نقطة لكل صديق ينضم!
          </p>
          
          <div className="flex items-center gap-2 bg-surface rounded-2xl p-3">
            <code className="flex-1 text-accent-dark font-bold text-lg">
              {membership?.referral_code || 'جاري التحميل...'}
            </code>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyReferral}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                showReferral 
                  ? 'bg-success text-white' 
                  : 'bg-accent text-white'
              }`}
            >
              {showReferral ? 'تم النسخ!' : 'شارك'}
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 mb-6 shadow-card"
        >
          <h3 className="text-lg font-bold text-text mb-4">⚙️ الإعدادات</h3>
          
          <div className="space-y-3">
            <button 
              onClick={() => {
                setSelectedDate(user?.birth_date || '')
                setShowDatePicker(true)
              }}
              className="w-full flex items-center justify-between p-4 bg-surface rounded-2xl"
            >
              <span className="text-text font-medium">🎂 عيد الميلاد</span>
              <span className="text-muted text-sm">
                {user?.birth_date || 'لم يتم التعيين'}
              </span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 bg-surface rounded-2xl">
              <span className="text-text font-medium">🌐 اللغة</span>
              <span className="text-muted text-sm">العربية</span>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-card"
        >
          <h3 className="text-lg font-bold text-text mb-4">🎟️ قسائمك</h3>
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🎟️</p>
            <p className="text-muted">لا توجد قسائم نشطة</p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold text-text mb-4 text-right">🎂 تاريخ عيد الميلاد</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-4 bg-surface border border-border rounded-2xl text-text outline-none focus:border-accent mb-4"
              />
              <p className="text-muted text-sm mb-6 text-right">
                أضف عيد ميلادك واحصل على 50 نقطة إضافية وعروض خاصة في يوم ميلادك!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 py-3 bg-surface text-muted font-bold rounded-2xl"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveBirthDate}
                  className="flex-1 py-3 bg-accent text-white font-bold rounded-2xl"
                >
                  حفظ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
