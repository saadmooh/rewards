import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useUserStore from '../store/userStore';
import { supabase } from '../lib/supabase';

export default function BookingModal({ isOpen, onClose, product, store }) {
  const { t } = useTranslation();
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [existingBooking, setExistingBooking] = useState(null)
  const [formData, setFormData] = useState({
    preferred_date: '',
    preferred_time: '',
    notes: ''
  })

  // Check for existing booking when modal opens
  useEffect(() => {
    if (isOpen && user?.id && product?.id && store?.id) {
      const checkExisting = async () => {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .eq('store_id', store.id)
          .in('status', ['pending', 'confirmed'])
          .maybeSingle()
        
        if (!error && data) {
          setExistingBooking(data)
        } else {
          setExistingBooking(null)
        }
      }
      checkExisting()
    }
  }, [isOpen, user?.id, product?.id, store?.id])

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ]

  const getToday = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id || !store?.id || !product?.id) return

    setLoading(true)
    try {
      const { error } = await supabase.from('bookings').insert({
        store_id: store.id,
        user_id: user.id,
        product_id: product.id,
        preferred_date: formData.preferred_date,
        preferred_time: formData.preferred_time,
        notes: formData.notes || null,
        status: 'pending'
      })

      if (error) throw error
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err) {
      console.error('Booking error:', err)
      alert(t('bookings.error_booking'))
    }
    setLoading(false)
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-6 left-6 w-10 h-10 bg-surface rounded-full flex items-center justify-center text-muted hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-text">{t('product_detail.book_treatment')}</h2>
            <p className="text-muted text-sm font-medium mt-1">{product?.name}</p>
            {product?.duration_minutes && (
              <p className="text-accent text-xs font-bold mt-2">⏱️ {product.duration_minutes} {t('common.minutes')}</p>
            )}
          </div>

          {success ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-xl font-black text-accent mb-2">{t('bookings.booking_confirmed')}</p>
              <p className="text-muted text-sm">{t('bookings.booking_requested_desc')}</p>
            </div>
          ) : existingBooking ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <p className="text-xl font-black text-text mb-2">{t('bookings.already_booked')}</p>
              <p className="text-muted text-sm px-6">
                {t('bookings.already_booked_desc', { 
                  status: existingBooking.status, 
                  date: existingBooking.preferred_date, 
                  time: existingBooking.preferred_time 
                })}
              </p>
              <button
                onClick={onClose}
                className="mt-8 px-8 py-4 bg-surface text-text rounded-2xl font-black transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-widest mb-2 px-1">
                  Select Date
                </label>
                <input
                  type="date"
                  required
                  min={getToday()}
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                  className="w-full p-4 bg-surface border border-border rounded-2xl font-bold text-text focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-widest mb-2 px-1">
                  Select Time
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData({ ...formData, preferred_time: time })}
                      className={`p-3 rounded-xl text-xs font-bold transition-all ${
                        formData.preferred_time === time
                          ? 'bg-accent text-white'
                          : 'bg-surface border border-border text-muted hover:border-accent'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-widest mb-2 px-1">
                  Notes (optional)
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('bookings.notes_placeholder')}
                  className="w-full p-4 bg-surface border border-border rounded-2xl font-bold text-text focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all resize-none"
                />
              </div>

              <div className="bg-accent-light p-4 rounded-2xl border border-accent/20 flex items-start gap-3">
                <span className="text-xl">💆</span>
                <div>
                  <p className="text-accent-dark font-black text-xs uppercase tracking-widest">{t('bookings.confirmation_title')}</p>
                  <p className="text-accent-dark/80 text-xs font-medium">{t('bookings.review_desc')}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.preferred_date || !formData.preferred_time}
                className="w-full py-5 bg-accent text-white rounded-2xl font-black text-lg shadow-xl shadow-accent/20 transition-all hover:bg-accent-dark active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? t('bookings.booking_loading') : `✓ ${t('bookings.book_now')}`}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}