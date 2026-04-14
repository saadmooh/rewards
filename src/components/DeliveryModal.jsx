import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WILAYAS, getDefaultMunicipalities } from '../lib/algeria-locations';

export default function DeliveryModal({ isOpen, onClose, onSubmit, product, loading }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    wilaya: '',
    municipality: '',
    address: '',
    delivery_type: 'home'
  });

  const [municipalities, setMunicipalities] = useState([]);

  useEffect(() => {
    if (formData.wilaya) {
      setMunicipalities(getDefaultMunicipalities(formData.wilaya));
      setFormData(prev => ({ ...prev, municipality: '' }));
    }
  }, [formData.wilaya]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedWilaya = WILAYAS.find(w => w.id === formData.wilaya)?.name;
    const selectedMuni = municipalities.find(m => m.id === formData.municipality)?.name;
    
    onSubmit({
      ...formData,
      wilaya: selectedWilaya,
      municipality: selectedMuni,
      product_id: product.id,
      store_id: product.store_id
    });
  };

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
            <h2 className="text-2xl font-black text-text">{t('delivery.request_delivery')}</h2>
            <p className="text-muted text-sm font-medium mt-1">{product.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-widest mb-2 px-1">
                  {t('delivery.select_wilaya')}
                </label>
                <select
                  required
                  value={formData.wilaya}
                  onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                  className="w-full p-4 bg-surface border border-border rounded-2xl font-bold text-text focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all appearance-none"
                >
                  <option value="">{t('delivery.choose_wilaya')}</option>
                  {WILAYAS.map(w => (
                    <option key={w.id} value={w.id}>{w.id} - {w.name} ({w.name_ar})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-widest mb-2 px-1">
                  {t('delivery.select_municipality')}
                </label>
                <select
                  required
                  disabled={!formData.wilaya}
                  value={formData.municipality}
                  onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                  className="w-full p-4 bg-surface border border-border rounded-2xl font-bold text-text focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all appearance-none disabled:opacity-50"
                >
                  <option value="">{t('delivery.choose_municipality')}</option>
                  {municipalities.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.name_ar})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-muted uppercase tracking-widest mb-2 px-1">
                  {t('delivery.detailed_address')}
                </label>
                <textarea
                  required
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('delivery.address_placeholder')}
                  className="w-full p-4 bg-surface border border-border rounded-2xl font-bold text-text focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, delivery_type: 'home' })}
                  className={`p-4 rounded-2xl border-2 font-black transition-all flex flex-col items-center gap-2 ${
                    formData.delivery_type === 'home'
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border bg-white text-muted grayscale'
                  }`}
                >
                  <span className="text-2xl">🏠</span>
                  <span className="text-xs uppercase tracking-widest">{t('delivery.home')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, delivery_type: 'office' })}
                  className={`p-4 rounded-2xl border-2 font-black transition-all flex flex-col items-center gap-2 ${
                    formData.delivery_type === 'office'
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border bg-white text-muted grayscale'
                  }`}
                >
                  <span className="text-2xl">🏢</span>
                  <span className="text-xs uppercase tracking-widest">{t('delivery.office')}</span>
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex items-start gap-3">
               <span className="text-xl">💵</span>
               <div>
                  <p className="text-yellow-800 font-black text-xs uppercase tracking-widest">{t('delivery.payment_method')}</p>
                  <p className="text-yellow-700/80 text-xs font-bold">{t('delivery.cod_description')}</p>
               </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-text text-white rounded-2xl font-black text-lg shadow-xl shadow-gray-200 transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? t('delivery.processing') : t('delivery.confirm_order')}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
