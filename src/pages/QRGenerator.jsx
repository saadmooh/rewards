import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import QRCode from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { startOfDay } from 'date-fns'

const EXPIRY_SECONDS = 300

export default function QRGenerator() {
  const { store } = useDashboardStore()
  const [amount, setAmount] = useState('')
  const [phase, setPhase] = useState('input')
  const [qrToken, setQrToken] = useState(null)
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS)
  const timerRef = useRef(null)

  const points = amount ? Math.floor(Number(amount) / 10) * (store?.points_rate ?? 1) : 0

  const generate = async () => {
    if (!amount || Number(amount) <= 0) return

    const token = `QR-${store.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const expiresAt = new Date(Date.now() + EXPIRY_SECONDS * 1000)

    // Insert pending transaction (no user_id yet)
    const { error } = await supabase.from('transactions').insert({
      store_id: store.id,
      type: 'earn',
      points,
      amount: Number(amount),
      qr_token: token,
      expires_at: expiresAt.toISOString(),
      note: 'Generated QR Code',
    })

    if (error) { 
      console.error('Error generating QR transaction:', error)
      return 
    }

    setQrToken(token)
    setTimeLeft(EXPIRY_SECONDS)
    setPhase('qr')
  }

  useEffect(() => {
    if (phase !== 'qr') return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setPhase('expired')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const reset = () => {
    clearInterval(timerRef.current)
    setAmount('')
    setQrToken(null)
    setPhase('input')
  }

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

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

  if (phase === 'input') return (
    <div className="qr-page p-4 lg:p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-[#f0f0f0] mb-6 text-center">قيمة الطلبية</h2>
      
      <div className="bg-[#1e1e1e] rounded-xl p-6 border border-[#2a2a2a] mb-6">
        <div className="amount-wrapper flex flex-col items-center">
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            className="text-4xl font-bold text-center bg-transparent border-b-2 border-[#2a2a2a] text-[#f0f0f0] pb-2 w-full focus:outline-none focus:border-[#D4AF37]"
            autoFocus
          />
          <span className="text-[#888888] text-lg mt-2">دج</span>
        </div>
        
        {points > 0 && (
          <p className="text-center text-[#888888] mt-4">
            سيكسب الزبون: <strong className="text-[#D4AF37]">{points} نقطة</strong>
          </p>
        )}
        
        <button
          className="w-full mt-6 bg-[#D4AF37] text-black py-3 rounded-xl font-semibold hover:bg-[#c4a02e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={generate}
          disabled={!amount || Number(amount) <= 0}
        >
          توليد QR
        </button>
      </div>

      {todayTx?.length > 0 && (
        <div className="bg-[#1e1e1e] rounded-xl p-4 border border-[#2a2a2a]">
          <h4 className="text-[#f0f0f0] font-semibold mb-3">عمليات اليوم</h4>
          <div className="space-y-2">
            {todayTx.map((tx, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#888888]">{tx.users?.full_name ?? '—'}</span>
                <div className="flex gap-3">
                  <span className="text-[#22c55e]">+{tx.points} نقطة</span>
                  <span className="text-[#888888]">{(tx.amount ?? 0).toLocaleString()} دج</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (phase === 'qr') return (
    <div className="qr-page p-4 lg:p-6 max-w-md mx-auto flex flex-col items-center">
      <div className="bg-white p-4 rounded-xl mb-4">
        <QRCode value={qrToken} size={280} level="H" includeMargin />
      </div>
      
      <div className={`text-2xl font-bold mb-2 ${timeLeft < 60 ? 'text-[#ef4444]' : 'text-[#f0f0f0]'}`}>
        ⏱ {formatTime(timeLeft)}
      </div>
      
      <p className="text-[#f0f0f0] text-lg mb-1">
        {Number(amount).toLocaleString()} دج — {points} نقطة
      </p>
      <p className="text-[#888888] text-sm mb-6">صالح لمرة واحدة فقط</p>
      
      <button 
        className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#c4a02e] transition-colors"
        onClick={reset}
      >
        توليد جديد
      </button>
    </div>
  )

  return (
    <div className="qr-page p-4 lg:p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh]">
      <div className="text-5xl mb-4">⌛</div>
      <p className="text-[#f0f0f0] text-xl font-semibold mb-2">انتهت صلاحية الكود</p>
      <p className="text-[#888888] mb-6">يرجى توليد كود جديد</p>
      <button 
        className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#c4a02e] transition-colors"
        onClick={reset}
      >
        توليد جديد
      </button>
    </div>
  )
}
