import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QRCodeCanvas } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { startOfDay } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Hourglass, CheckCircle2, XCircle, Copy, Save, RefreshCcw, Lock, Crown, Tag } from 'lucide-react'
import DoorQrDisplay from '../components/DoorQrDisplay'

const EXPIRY_SECONDS = 300 // 5 minutes for temporary QR codes

export default function QRGenerator() {
  const { t } = useTranslation()
  const { store } = useDashboardStore()
  const [amount, setAmount] = useState('')
  const [qrToken, setQrToken] = useState(null)
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS)
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState('idle') // 'idle', 'active', 'expired' for standard QR
  const timerRef = useRef(null)

  // State for Door QR System
  const [doorQrMode, setDoorQrMode] = useState(false); // Toggle between standard QR and Door QR system
  const [waitingCustomers, setWaitingCustomers] = useState([]); // List of customers waiting for points
  const [selectedCustomerId, setSelectedCustomerId] = useState(null); // Customer to assign points to
  const [assignmentStatus, setAssignmentStatus] = useState('idle'); // 'idle', 'assigning', 'success', 'error'

  const points = amount ? Math.floor(Number(amount) / 10) * (store?.points_rate ?? 1) : 0

  // --- Standard QR Generation (for specific purchases) ---
  const generateStandardQR = async () => {
    if (!amount || Number(amount) <= 0) return;
    setIsGenerating(true);

    const token = `QR-${store.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const expiresAt = new Date(Date.now() + EXPIRY_SECONDS * 1000);

    setQrToken(token);
    setStatus('active');
    setTimeLeft(EXPIRY_SECONDS);
    setIsGenerating(false);

    // Background Insert for transaction
    supabase.from('transactions').insert({
      store_id: store.id,
      type: 'earn',
      points,
      amount: Number(amount),
      qr_token: token,
      expires_at: expiresAt.toISOString(),
      note: 'Generated QR Code for purchase',
    }).then(({ error }) => {
      if (error) console.error('Error recording QR transaction:', error);
    });
  };

  // --- Door QR System Logic ---

  // Fetch waiting customers list
  const fetchWaitingCustomers = async () => {
    if (!store?.id) return;
    try {
      const { data, error } = await supabase
        .from('pending_point_claims')
        .select('id, user_id, created_at, status, users(full_name, username)') // Include user info
        .eq('store_id', store.id)
        .eq('status', 'waiting')
        .order('created_at', { ascending: true }) // FIFO order
        .limit(10); // Limit for display
      
      if (error) throw error;
      setWaitingCustomers(data || []);
    } catch (error) {
      console.error("Error fetching waiting customers:", error);
      // Handle error display
    }
  };

  // Function to assign points to a selected waiting customer
  const assignPointsToCustomer = async (claimId, userId, membershipId, amount, points) => {
    setAssignmentStatus('assigning');
    try {
      // 1. Update the pending_point_claims status to 'claimed'
      const { error: updateClaimError } = await supabase
        .from('pending_point_claims')
        .update({ status: 'claimed', claimed_at: new Date().toISOString(), amount_claimed: amount, points_claimed: points })
        .eq('id', claimId);
      
      if (updateClaimError) throw updateClaimError;

      // 2. Add points to the user's membership
      const { data: membershipData } = await supabase.from('user_store_memberships').select('points').eq('id', membershipId).single();
      if (!membershipData) throw new Error('Membership not found');
      
      const newPoints = membershipData.points + points;
      const { error: updateMembershipError } = await supabase
        .from('user_store_memberships')
        .update({ points: newPoints })
        .eq('id', membershipId);
      
      if (updateMembershipError) throw updateMembershipError;

      // 3. Create a transaction record
      await supabase.from('transactions').insert({
        user_id: userId,
        store_id: store.id,
        membership_id: membershipId,
        type: 'earn', // 'earn' because customer receives points
        points: points,
        amount: amount,
        note: 'Points from door QR claim',
        status: 'completed', // Or however status is managed
      });

      // Refresh waiting list
      fetchWaitingCustomers();
      setSelectedCustomerId(null); // Clear selection
      setAssignmentStatus('success');
      setTimeout(() => setAssignmentStatus('idle'), 3000); // Reset status after a delay

    } catch (error) {
      console.error("Error assigning points:", error);
      setAssignmentStatus('error');
      // Handle error display
    }
  };

  // Fetch waiting customers periodically or use a subscription
  useEffect(() => {
    fetchWaitingCustomers();
    const interval = setInterval(fetchWaitingCustomers, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [store?.id]); // Re-fetch if store changes


  // Timer logic for standard QR
  useEffect(() => {
    if (status !== 'active') return
    
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setStatus('expired')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timerRef.current)
  }, [status])

  const resetStandardQR = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setAmount('')
    setQrToken(null)
    setStatus('idle')
    setTimeLeft(EXPIRY_SECONDS)
  }

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  // Fetch recent transactions for display
  const { data: todayTx } = useQuery({
    queryKey: ['today-tx', store?.id],
    queryFn: () => supabase
      .from('transactions')
      .select('points, amount, created_at, users(full_name)')
      .eq('store_id', store.id)
      .eq('type', 'earn')
      .gte('created_at', startOfDay(new Date()).toISOString())
      .order('created_at', { ascending: false })
      .limit(5)
      .then(r => r.data),
    enabled: !!store?.id
  })

  const pointsForAmount = amount ? Math.floor(Number(amount) / 10) * (store?.points_rate ?? 1) : 0;

  return (
    <div className="qr-page p-4 lg:p-6 max-w-md mx-auto pb-24 text-right">
      {/* Header with toggle for QR modes */}
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold tracking-tight ${doorQrMode ? 'text-white' : 'text-[#f0f0f0]'}`}>
          {doorQrMode ? t('qr_generator.door_system') : t('qr_generator.title')}
        </h2>
        <button
          onClick={() => setDoorQrMode(!doorQrMode)}
          className="px-4 py-2 rounded-xl font-bold text-sm transition-all transform active:scale-95"
          style={{ backgroundColor: doorQrMode ? '#D4AF37' : '#2a2a2a', color: doorQrMode ? 'black' : '#f0f0f0' }}
        >
          {doorQrMode ? t('qr_generator.switch_to_purchase') : t('qr_generator.switch_to_door')}
        </button>
      </div>
      
      {/* Door QR System View */}
      {doorQrMode && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-[#f0f0f0] mb-4 text-center tracking-tight">{t('qr_generator.door_system')}</h3>
          <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-[#2a2a2a] shadow-xl">
            {store?.slug && <DoorQrDisplay storeSlug={store.slug} />}
          </div>

          {/* Waiting Customers List */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-[#f0f0f0] mb-4 text-center tracking-tight">{t('qr_generator.waiting_customers')}</h3>
            {waitingCustomers.length > 0 ? (
              <div className="space-y-3">
                {waitingCustomers.map(claim => (
                  <div 
                    key={claim.id} 
                    className={`bg-[#1e1e1e] border rounded-xl p-4 flex justify-between items-center flex-row-reverse cursor-pointer transition-all ${selectedCustomerId === claim.id ? 'border-accent shadow-md' : 'border-[#2a2a2a]'}`}
                    onClick={() => setSelectedCustomerId(claim.id)}
                  >
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm">👤</div>
                      <div className="text-right">
                        <p className="text-white text-sm font-bold">{claim.users?.full_name ?? claim.users?.username ?? 'Customer'}</p>
                        <p className="text-[#888888] text-[10px]">{new Date(claim.created_at).toLocaleTimeString('ar-DZ')}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-[#888888] text-sm">Waiting...</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted text-sm">لا يوجد عملاء في الانتظار حالياً.</p>
            )}
            
            {/* Assignment Button */}
            <div className="mt-6 flex justify-center">
              <button
                className={`bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-black hover:bg-[#c4a02e] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${assignmentStatus === 'assigning' ? 'animate-pulse' : ''}`}
                onClick={() => {
                  const selectedClaim = waitingCustomers.find(c => c.id === selectedCustomerId);
                  if (selectedClaim && amount && Number(amount) > 0) {
                    assignPointsToCustomer(selectedClaim.id, selectedClaim.user_id, selectedClaim.membership_id, Number(amount), pointsForAmount);
                  } else if (!amount || Number(amount) <= 0) {
                    alert("يرجى إدخال مبلغ شراء صالح.");
                  } else {
                    alert("يرجى تحديد عميل لتعيين النقاط له.");
                  }
                }}
                disabled={!selectedCustomerId || !amount || Number(amount) <= 0 || assignmentStatus === 'assigning'}
              >
                {assignmentStatus === 'assigning' ? 'جاري التعيين...' : 'تعيين النقاط'}
              </button>
            </div>
            {assignmentStatus === 'success' && <p className="text-green-500 text-center mt-4">تمت تعيين النقاط بنجاح!</p>}
            {assignmentStatus === 'error' && <p className="text-red-500 text-center mt-4">فشل في تعيين النقاط.</p>}
          </div>
        </div>
      )}

      {/* Standard QR Generation View */}
      {!doorQrMode && (
        <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-[#2a2a2a] shadow-xl mb-6">
          <div className="amount-wrapper flex flex-col items-center">
            <label className="text-xs text-[#888888] uppercase tracking-widest mb-2">{t('qr_generator.purchase_amount')}</label>
            <div className="relative w-full">
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={status === 'active'}
                placeholder="0"
                className="text-5xl font-black text-center bg-transparent border-b-2 border-[#2a2a2a] text-[#f0f0f0] pb-4 w-full focus:outline-none focus:border-[#D4AF37] transition-colors disabled:opacity-50 text-right"
                autoFocus
              />
              <span className="absolute left-0 bottom-4 text-[#888888] font-bold">{t('products.dzd')}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-[#888888]">
              {t('qr_generator.customer_points')}: <span className="text-[#D4AF37] font-bold">{points}</span>
            </div>
            {status === 'idle' ? (
              <button
                className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-black hover:bg-[#c4a02e] transition-all transform active:scale-95 disabled:opacity-50"
                onClick={generateStandardQR}
                disabled={!amount || Number(amount) <= 0 || isGenerating}
              >
{t('qr_generator.generate')}
              </button>
            ) : (
              <button
                className="text-[#888888] hover:text-[#f0f0f0] text-sm underline"
                onClick={resetStandardQR}
              >
                {t('qr_generator.reset')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* QR Code Section (Standard Mode) */}
      {!doorQrMode && status !== 'idle' && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl relative">
              {status === 'expired' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-3xl p-6 text-center">
                  <span className="text-5xl mb-4">⌛</span>
                  <h3 className="text-white text-xl font-bold mb-2">{t('qr_generator.expired')}</h3>
                  <button 
                    onClick={resetStandardQR}
                    className="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-bold"
                  >
                    {t('qr_generator.regenerate')}
                  </button>
                </div>
              )}

              <div className="relative p-2 bg-white rounded-xl border-4 border-gray-100">
                <QRCodeCanvas value={qrToken} size={240} level="H" includeMargin={false} />
              </div>

              <div className="mt-6 text-center">
                <div className={`text-3xl font-mono font-black mb-1 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-black'}`}>
                  {formatTime(timeLeft)}
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter">
                  Valid for {formatTime(timeLeft)} • {Number(amount).toLocaleString()} دج
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Recent Activity (shown only in standard QR mode when idle) */}
      {!doorQrMode && status === 'idle' && todayTx?.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8"
        >
          <h4 className="text-[#888888] text-xs font-bold uppercase mb-4 px-2 text-right">نشاط اليوم الأخير</h4>
          <div className="space-y-3">
            {todayTx.map((tx, i) => (
              <div key={i} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4 flex justify-between items-center flex-row-reverse">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm">👤</div>
                  <div className="text-right">
                    <p className="text-white text-sm font-bold">{tx.users?.full_name ?? 'Customer'}</p>
                    <p className="text-[#888888] text-[10px]">{new Date(tx.created_at).toLocaleTimeString('ar-DZ')}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-[#22c55e] text-sm font-black">+{tx.points} نقطة</p>
                  <p className="text-[#888888] text-[10px]">{(tx.amount ?? 0).toLocaleString()} دج</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
