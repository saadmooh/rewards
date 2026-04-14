import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '../store/dashboardStore';
import { useDeliveries } from '../hooks/useDeliveries';
import { Package, Truck, CheckCircle, Clock, XCircle, Phone, MapPin, User, Search, Filter } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-600', label: 'pending' },
  confirmed: { icon: CheckCircle, color: 'bg-blue-100 text-blue-600', label: 'confirmed' },
  shipped: { icon: Truck, color: 'bg-purple-100 text-purple-600', label: 'shipped' },
  delivered: { icon: CheckCircle, color: 'bg-green-100 text-green-600', label: 'delivered' },
  cancelled: { icon: XCircle, color: 'bg-red-100 text-red-600', label: 'cancelled' }
};

export default function Deliveries() {
  const { t } = useTranslation();
  const { store } = useDashboardStore();
  const { getStoreDeliveries, updateDeliveryStatus, loading: actionLoading } = useDeliveries();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchDeliveries = async () => {
    if (!store?.id) return;
    setLoading(true);
    const { data } = await getStoreDeliveries(store.id);
    if (data) setDeliveries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeliveries();
  }, [store?.id]);

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    const { error } = await updateDeliveryStatus(deliveryId, newStatus);
    if (!error) {
      fetchDeliveries();
    } else {
      alert(error);
    }
  };

  const filteredDeliveries = deliveries.filter(d => {
    const matchesFilter = filter === 'all' || d.status === filter;
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      d.user?.full_name?.toLowerCase().includes(searchLower) ||
      d.wilaya?.toLowerCase().includes(searchLower) ||
      d.municipality?.toLowerCase().includes(searchLower) ||
      d.product?.name?.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text tracking-tight">{t('deliveries.title')}</h1>
          <p className="text-sm text-muted font-medium">{t('deliveries.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
           <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className="w-full bg-white border border-border rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-accent transition-colors"
              />
           </div>
           <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-white border border-border rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-accent appearance-none pr-10"
              >
                <option value="all">{t('common.all')}</option>
                {Object.keys(STATUS_CONFIG).map(s => (
                  <option key={s} value={s}>{t(`deliveries.status.${s}`)}</option>
                ))}
              </select>
              <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
           </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 h-48 animate-pulse border border-border" />
          ))
        ) : filteredDeliveries.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredDeliveries.map((delivery) => (
              <motion.div
                key={delivery.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 border border-border shadow-soft group hover:border-accent transition-all"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Product & Status Section */}
                  <div className="flex gap-4 min-w-[300px]">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface border border-border flex-shrink-0">
                      <img
                        src={delivery.product?.image_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'}
                        alt={delivery.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_CONFIG[delivery.status].color}`}>
                            {t(`deliveries.status.${delivery.status}`)}
                         </span>
                         <span className="text-[10px] text-muted font-bold">
                            {new Date(delivery.created_at).toLocaleDateString()}
                         </span>
                      </div>
                      <h3 className="font-black text-text leading-tight">{delivery.product?.name}</h3>
                      <p className="text-accent font-black text-sm">{delivery.product?.price?.toLocaleString()} DZD</p>
                    </div>
                  </div>

                  {/* Customer & Address Info */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:border-x lg:border-border lg:px-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-text">
                        <User size={14} className="text-muted" />
                        <span className="text-sm font-bold">{delivery.user?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text">
                        <Phone size={14} className="text-muted" />
                        <a href={`tel:${delivery.user?.phone}`} className="text-sm font-bold hover:text-accent transition-colors">{delivery.user?.phone || '—'}</a>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-xl border border-border w-fit">
                         <span className="text-xs uppercase font-black tracking-widest text-muted">{delivery.delivery_type === 'home' ? '🏠 ' + t('delivery.home') : '🏢 ' + t('delivery.office')}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-start gap-2 text-text">
                          <MapPin size={14} className="text-muted mt-1 flex-shrink-0" />
                          <div className="text-sm font-bold">
                             <p>{delivery.wilaya}, {delivery.municipality}</p>
                             <p className="text-muted font-medium text-xs mt-1 leading-relaxed">{delivery.address}</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex flex-col justify-center gap-2 lg:w-48">
                    {delivery.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(delivery.id, 'confirmed')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-soft shadow-accent/20 hover:bg-accent-dark transition-all active:scale-95"
                      >
                        {t('deliveries.actions.confirm')}
                      </button>
                    )}
                    {delivery.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(delivery.id, 'shipped')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-soft shadow-purple-200 hover:bg-purple-700 transition-all active:scale-95"
                      >
                        {t('deliveries.actions.ship')}
                      </button>
                    )}
                    {delivery.status === 'shipped' && (
                      <button
                        onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-soft shadow-green-200 hover:bg-green-700 transition-all active:scale-95"
                      >
                        {t('deliveries.actions.complete')}
                      </button>
                    )}
                    {['pending', 'confirmed'].includes(delivery.status) && (
                      <button
                        onClick={() => handleStatusUpdate(delivery.id, 'cancelled')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-surface border border-border text-muted rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                      >
                        {t('deliveries.actions.cancel')}
                      </button>
                    )}
                    {['delivered', 'cancelled'].includes(delivery.status) && (
                       <div className="text-center">
                          <p className="text-[10px] font-black text-muted uppercase tracking-widest">{t('deliveries.final_state')}</p>
                       </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-border">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
               <Package size={32} className="text-muted" />
            </div>
            <h3 className="text-lg font-black text-text">{t('deliveries.empty_state')}</h3>
            <p className="text-muted text-sm font-medium">{t('deliveries.empty_desc')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
