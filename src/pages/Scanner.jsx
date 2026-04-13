import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import useUserStore from '../store/userStore'
import { supabase } from '../lib/supabase'

export default function Scanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, membership, store, addPoints } = useUserStore()
  const [phase, setPhase] = useState('scanning')
  const [error, setError] = useState(null)
  const [pointsEarned, setPointsEarned] = useState(0)
  const scannerRef = useRef(null)

  useEffect(() => {
    if (phase !== 'scanning' || scannerRef.current) return

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    scanner.render(
      async (decodedText) => {
        setPhase('verifying')
        
        try {
          // Try to parse as JSON (from store system)
          let qrData
          try {
            qrData = JSON.parse(decodedText)
          } catch {
            qrData = { token: decodedText, amount: 0 }
          }

          // If it's a token, verify with Supabase
          if (qrData.token) {
            const { data: tx, error: txError } = await supabase
              .from('transactions')
              .select('*')
              .eq('qr_token', qrData.token)
              .single()

            if (txError || !tx) {
              setError(t('scanner.invalid_qr'))
              setPhase('error')
              return
            }

            if (tx.qr_used) {
              setError(t('scanner.qr_used'))
              setPhase('error')
              return
            }

            if (new Date(tx.expires_at) < new Date()) {
              setError(t('scanner.qr_expired'))
              setPhase('error')
              return
            }

            // Mark as used and assign to the current user
            const { error: updateErr } = await supabase
              .from('transactions')
              .update({ 
                qr_used: true, 
                user_id: user.id,
                membership_id: membership?.id,
                note: `Redeemed QR - ${tx.amount} DZD`
              })
              .eq('id', tx.id)

            if (updateErr) {
              console.error('Error updating transaction:', updateErr)
              setError(t('scanner.processing_failed'))
              setPhase('error')
              return
            }

            // Add points to user membership in the store
            const { error: memErr } = await supabase
              .from('user_store_memberships')
              .update({
                points: (membership.points || 0) + tx.points,
                last_purchase: new Date().toISOString(),
              })
              .eq('id', membership.id)

            if (memErr) {
              console.error('Error updating membership points:', memErr)
            }

            setPointsEarned(tx.points)
            setPhase('success')
          } else {
            setError(t('scanner.invalid_format'))
            setPhase('error')
          }
        } catch (err) {
          console.error('Scan error:', err)
          setError(t('scanner.verification_failed'))
          setPhase('error')
        }
      },
      (err) => {
        console.warn('QR scan error:', err)
      }
    )

    scannerRef.current = scanner

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [phase, user, addPoints, membership, store])

  const handleRetry = () => {
    scannerRef.current = null
    setPhase('scanning')
    setError(null)
  }

  if (phase === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-light to-white flex items-center justify-center p-5">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-5xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">{t('scanner.points_added')}</h2>
          <p className="text-3xl font-extrabold text-accent mb-2">+{pointsEarned} {t('common.points')}</p>
          <p className="text-muted mb-8">{t('scanner.thanks_purchase')}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-10 py-4 bg-accent text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            {t('scanner.awesome')}
          </motion.button>
        </motion.div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-surface p-5 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">{t('scanner.scan_failed')}</h2>
          <p className="text-muted mb-6">{error || t('scanner.invalid_qr')}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRetry}
            className="px-8 py-3 bg-accent text-white font-bold rounded-2xl"
          >
            {t('scanner.try_again_btn')}
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface p-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">{t('scanner.title')}</h1>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-white rounded-xl text-muted font-medium"
        >
          {t('scanner.cancel')}
        </button>
      </div>

      <div className="bg-white rounded-3xl p-4 shadow-card">
        <div id="qr-reader" className="w-full" />
        
        {phase === 'verifying' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted font-medium">{t('scanner.verifying')}</p>
          </div>
        )}

        {phase === 'scanning' && (
          <p className="text-center text-muted text-sm mt-4">
            {t('scanner.place_qr_inside')}
          </p>
        )}
      </div>

      <style>{`
        #qr-reader { border: none !important; }
        #qr-reader video { border-radius: 16px; }
        #qr-reader__scan_region { background: #f8fafc !important; }
      `}</style>
    </div>
  )
}
