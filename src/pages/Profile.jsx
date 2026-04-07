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
    <div className="min-h-screen bg-white pb-24 text-right">
      <div className="p-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900">الملف الشخصي</h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-3xl p-6 border border-border"
            >
              <div className="flex items-center justify-end gap-4 mb-6">
                <div className="text-right order-2 md:order-1">
                  <h2 className="text-xl font-black text-gray-900">
                    {user?.full_name || user?.first_name || 'مستخدم'}
                  </h2>
                  <div className="flex justify-end mt-1">
                    <TierBadge tier={membership?.tier || 'bronze'} size="medium" />
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white shadow-soft border border-border flex items-center justify-center overflow-hidden order-1 md:order-2">
                  {user?.photo_url ? (
                    <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-400">👤</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/50">
                <div className="text-right">
                  <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">اسم المستخدم</p>
                  <p className="text-text font-bold">@{user?.username || 'unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">عضو منذ</p>
                  <p className="text-text font-bold">يناير 2024</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-soft border border-border"
            >
              <h3 className="text-lg font-black text-text mb-2">🎁 دعوة الأصدقاء</h3>
              <p className="text-muted text-sm mb-6">
                شارك رابطك واكسب 200 نقطة لكل صديق ينضم!
              </p>
              
              <div className="flex items-center gap-3 bg-surface rounded-2xl p-4 border border-border">
                <code className="flex-1 text-accent font-black text-xl tracking-wider text-left">
                  {membership?.referral_code || '---'}
                </code>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={copyReferral}
                  className={`px-6 py-2.5 rounded-xl font-black text-sm shadow-soft transition-all ${
                    showReferral 
                      ? 'bg-green-600 text-white' 
                      : 'bg-accent text-white'
                  }`}
                >
                  {showReferral ? 'تم النسخ!' : 'نسخ الرابط'}
                </motion.button>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow-soft border border-border"
            >
              <h3 className="text-lg font-black text-text mb-6">⚙️ الإعدادات الشخصية</h3>
              
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setSelectedDate(user?.birth_date || '')
                    setShowDatePicker(true)
                  }}
                  className="w-full flex items-center justify-between p-4 bg-surface rounded-2xl border border-transparent hover:border-border transition-all group"
                >
                  <div className="flex items-center gap-3 text-right">
                     <span className="text-lg">🎂</span>
                     <div>
                        <p className="text-text font-bold text-sm">تاريخ الميلاد</p>
                        <p className="text-muted text-[10px] font-medium">{user?.birth_date || 'غير محدد'}</p>
                     </div>
                  </div>
                  <span className="text-accent text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">تعديل</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-4 bg-surface rounded-2xl border border-transparent hover:border-border transition-all group">
                   <div className="flex items-center gap-3 text-right">
                      <span className="text-lg">🌐</span>
                      <div>
                         <p className="text-text font-bold text-sm">اللغة المفضلة</p>
                         <p className="text-muted text-[10px] font-medium">العربية (الافتراضية)</p>
                      </div>
                   </div>
                   <span className="text-accent text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">تغيير</span>
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-6 shadow-soft border border-border"
            >
              <h3 className="text-lg font-black text-text mb-6">🎟️ قسائمي المفعلة</h3>
              <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-border">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-soft">
                   <span className="text-2xl opacity-50">🎟️</span>
                </div>
                <p className="text-muted text-xs font-bold">لا توجد قسائم نشطة حالياً</p>
                <button 
                  onClick={() => window.location.href = '/rewards/offers'}
                  className="mt-3 text-accent text-[11px] font-black uppercase tracking-widest hover:underline"
                >
                   استكشف العروض
                </button>
              </div>
            </motion.div>
          </div>
        </div>
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
