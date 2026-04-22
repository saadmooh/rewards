import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '../store/dashboardStore';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, CheckCircle, XCircle, Phone, User, Search, Filter, MessageSquare } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-600', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'bg-blue-100 text-blue-600', label: 'Confirmed' },
  completed: { icon: CheckCircle, color: 'bg-green-100 text-green-600', label: 'Completed' },
  cancelled: { icon: XCircle, color: 'bg-red-100 text-red-600', label: 'Cancelled' }
};

export default function Bookings() {
  const { t } = useTranslation();
  const { store } = useDashboardStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchBookings = async () => {
    if (!store?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, user:users(*), product:products(*)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) setBookings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [store?.id]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', bookingId);
    
    if (!error) {
      fetchBookings();
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      b.user?.full_name?.toLowerCase().includes(searchLower) ||
      b.product?.name?.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text tracking-tight">{t('bookings.title')}</h1>
          <p className="text-sm text-muted font-medium">{t('bookings.manage')}</p>
        </div>
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-xl">
            <Calendar className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-accent">{bookings.length} {t('common.total')}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder={t('bookings.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-12 p-3 bg-white border border-border rounded-2xl font-medium text-text focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filter === status
                  ? 'bg-accent text-white'
                  : 'bg-white border border-border text-muted hover:border-accent'
              }`}
            >
              {status === 'all' ? t('common.all') : t(`bookings.${status}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-border">
            <Calendar className="w-12 h-12 text-muted/20 mx-auto mb-4" />
            <p className="text-muted font-bold">{t('bookings.no_bookings')}</p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const StatusIcon = STATUS_CONFIG[booking.status]?.icon || Clock;
            const statusColor = STATUS_CONFIG[booking.status]?.color || 'bg-gray-100 text-gray-600';
            
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 border border-border shadow-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusColor}`}>
                        {t(`bookings.${booking.status}`)}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-black text-text mb-1">{booking.product?.name}</h3>
                    
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{booking.user?.full_name}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1 text-accent">
                        <Calendar className="w-4 h-4" />
                        <span className="font-bold">{booking.preferred_date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-accent">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold">{booking.preferred_time}</span>
                      </div>
                    </div>
                    
                    {booking.notes && (
                      <div className="mt-2 p-2 bg-surface rounded-lg text-sm text-muted">
                        <MessageSquare className="w-4 h-4 inline ml-1" />
                        {booking.notes}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold"
                        >
                          {t('bookings.confirm')}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-bold"
                        >
                          {t('common.cancel')}
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'completed')}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-bold"
                      >
                        {t('bookings.complete')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}