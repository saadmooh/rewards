import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, CheckCircle, XCircle, ChevronLeft, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useUserStore from '../store/userStore'

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-600', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'bg-blue-100 text-blue-600', label: 'Confirmed' },
  completed: { icon: CheckCircle, color: 'bg-green-100 text-green-600', label: 'Completed' },
  cancelled: { icon: XCircle, color: 'bg-red-100 text-red-600', label: 'Cancelled' }
}

export default function ClientBookings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, store } = useUserStore()

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['client-bookings', user?.id, store?.id],
    queryFn: async () => {
      if (!user?.id || !store?.id) return []
      const { data, error } = await supabase
        .from('bookings')
        .select('*, product:products(*)')
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id && !!store?.id
  })

  const handleCancel = async (bookingId) => {
    if (!confirm(t('bookings.cancel_confirm'))) return
    
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .eq('user_id', user.id) // Security check

    if (error) {
      alert(t('bookings.cancel_error'))
    } else {
      refetch()
    }
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="p-5 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-2xl bg-white shadow-soft flex items-center justify-center text-text transition-all active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-text tracking-tight">{t('common.bookings')}</h1>
          <p className="text-xs text-muted font-bold uppercase tracking-widest">{t('bookings.manage')}</p>
        </div>
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white rounded-3xl border border-border animate-pulse" />
            ))}
          </div>
        ) : bookings?.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending
              const Icon = status.icon

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2rem] p-6 shadow-soft border border-border relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                          {t(`bookings.${booking.status}`)}
                        </span>
                        <span className="text-[10px] text-muted font-bold uppercase tracking-widest">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="font-black text-lg text-text mb-1">{booking.product?.name}</h3>
                      
                      <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-2 text-accent bg-accent/5 px-3 py-1.5 rounded-xl border border-accent/10">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs font-black">{booking.preferred_date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-accent bg-accent/5 px-3 py-1.5 rounded-xl border border-accent/10">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-black">{booking.preferred_time}</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-4 p-3 bg-surface rounded-2xl text-xs font-medium text-muted border border-border flex gap-2">
                          <MessageSquare className="w-4 h-4 shrink-0 opacity-40" />
                          <p>"{booking.notes}"</p>
                        </div>
                      )}
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border overflow-hidden">
                      {booking.product?.image_url ? (
                        <img src={booking.product.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted/20">
                          <Icon size={24} />
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.status === 'pending' && (
                    <div className="mt-6 pt-6 border-t border-border flex justify-end">
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 rounded-xl text-xs font-black transition-all active:scale-95 border border-red-100"
                      >
                        <XCircle className="w-4 h-4" />
                        {t('bookings.cancel_appointment')}
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-border">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-muted/20" />
            </div>
            <h3 className="text-xl font-black text-text mb-2">{t('bookings.no_bookings_yet')}</h3>
            <p className="text-muted font-medium mb-8">{t('bookings.ready_for_care')}</p>
            <button 
              onClick={() => navigate('/products')}
              className="px-8 py-4 bg-accent text-white rounded-2xl font-black shadow-lg shadow-accent/20 active:scale-95 transition-all"
            >
              {t('bookings.browse_treatments')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
