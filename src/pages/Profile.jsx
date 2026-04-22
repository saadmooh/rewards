import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import useUserStore from '../store/userStore'
import TierBadge from '../components/TierBadge'

const SKIN_TYPES = ['Dry', 'Oily', 'Sensitive', 'Combination', 'Normal']

export default function Profile() {
  const { t, i18n } = useTranslation()
  const { user, membership, store, updateBirthDate, updateSkinType } = useUserStore()
  const [showReferral, setShowReferral] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showSkinPicker, setShowSkinPicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(user?.birth_date || '')
  const [selectedSkinType, setSelectedSkinType] = useState(user?.skin_type || '')

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

  const handleSaveSkinType = async () => {
    if (updateSkinType) {
      await updateSkinType(selectedSkinType)
    }
    setShowSkinPicker(false)
  }

  return (
    <div className="min-h-screen bg-white pb-24 text-right">
      <div className="p-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
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
                    {user?.full_name || user?.first_name || t('profile.user')}
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
                  <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">{t('profile.username')}</p>
                  <p className="text-text font-bold">@{user?.username || 'unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">{t('profile.member_since')}</p>
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
              <h3 className="text-lg font-black text-text mb-2">🎁 {t('profile.invite_friends')}</h3>
              <p className="text-muted text-sm mb-6">
                {t('profile.invite_desc')}
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
                  {showReferral ? t('common.copied') : t('common.copy_link')}
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
              <h3 className="text-lg font-black text-text mb-6">⚙️ {t('profile.personal_settings')}</h3>
              
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
                       <p className="text-text font-bold text-sm">{t('profile.birth_date')}</p>
                       <p className="text-muted text-[10px] font-medium">{user?.birth_date || t('profile.not_set')}</p>
                     </div>
                   </div>
                   <span className="text-accent text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">{t('common.edit')}</span>
                </button>

                <button 
                  onClick={() => {
                    setSelectedSkinType(user?.skin_type || '')
                    setShowSkinPicker(true)
                  }}
                  className="w-full flex items-center justify-between p-4 bg-surface rounded-2xl border border-transparent hover:border-border transition-all group"
                >
                  <div className="flex items-center gap-3 text-right">
                     <span className="text-lg">💆</span>
                     <div>
                       <p className="text-text font-bold text-sm">My Skin Profile</p>
                       <p className="text-muted text-[10px] font-medium">{user?.skin_type || 'Not set'}</p>
                     </div>
                   </div>
                   <span className="text-accent text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">{t('common.edit')}</span>
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-6 shadow-soft border border-border"
            >
              <h3 className="text-lg font-black text-text mb-6">🎟️ {t('profile.active_coupons')}</h3>
              <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-border">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-soft">
                   <span className="text-2xl opacity-50">🎟️</span>
                </div>
                <p className="text-muted text-xs font-bold">{t('profile.no_coupons')}</p>
                <button 
                  onClick={() => window.location.href = '/rewards/offers'}
                  className="mt-3 text-accent text-[11px] font-black uppercase tracking-widest hover:underline"
                >
                   {t('profile.explore_offers')}
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
              <h3 className="text-lg font-bold text-text mb-4 text-right">🎂 {t('profile.birth_date')}</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-4 bg-surface border border-border rounded-2xl text-text outline-none focus:border-accent mb-4"
              />
              <p className="text-muted text-sm mb-6 text-right">
                 {t('profile.birthday_bonus')}
               </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 py-3 bg-surface text-muted font-bold rounded-2xl"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveBirthDate}
                  className="flex-1 py-3 bg-accent text-white font-bold rounded-2xl"
                >
                  {t('common.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSkinPicker && (
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
              <h3 className="text-lg font-bold text-text mb-2 text-right">💆 My Skin Profile</h3>
              <p className="text-muted text-xs mb-6 text-right">Select your skin type for personalized treatment recommendations</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {SKIN_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedSkinType(type)}
                    className={`py-3 rounded-xl font-bold text-sm transition-all ${
                      selectedSkinType === type
                        ? 'bg-accent text-white'
                        : 'bg-surface border border-border text-muted hover:border-accent'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSkinPicker(false)}
                  className="flex-1 py-3 bg-surface text-muted font-bold rounded-2xl"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveSkinType}
                  className="flex-1 py-3 bg-accent text-white font-bold rounded-2xl"
                >
                  {t('common.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
