import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { motion } from 'framer-motion'
import useUserStore from '../store/userStore'
import { supabase } from '../lib/supabase'

export default function Scanner() {
  const navigate = useNavigate()
  const { user, addPoints, refreshUser } = useUserStore()
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
              // Create a demo transaction for testing
              const amount = qrData.amount || Math.floor(Math.random() * 500) + 100
              const points = Math.floor(amount / 10) // 1 point per 10 DZD
              
              // Save to Supabase
              if (user?.id) {
                await supabase.from('transactions').insert({
                  user_id: user.id,
                  type: 'earn',
                  points: points,
                  amount: amount,
                  note: `Purchase - ${amount} DZD`,
                })

                await supabase
                  .from('users')
                  .update({ 
                    points: (user.points || 0) + points,
                    last_purchase: new Date().toISOString()
                  })
                  .eq('id', user.id)
              }

              setPointsEarned(points)
              setPhase('success')
            } else if (tx.qr_used) {
              setError('This code has already been used')
              setPhase('error')
            } else {
              // Mark as used
              await supabase
                .from('transactions')
                .update({ qr_used: true, user_id: user.id })
                .eq('id', tx.id)

              // Add points to user
              await addPoints(tx.points, 'QR Scan')
              setPointsEarned(tx.points)
              setPhase('success')
            }
          } else {
            // Demo: simulate points
            const amount = qrData.amount || 450
            const points = Math.floor(amount / 10)
            setPointsEarned(points)
            setPhase('success')
          }
        } catch (err) {
          console.error('Scan error:', err)
          setError('Failed to verify QR code')
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
  }, [phase, user, addPoints])

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
          <h2 className="text-2xl font-bold text-text mb-2">Points Added!</h2>
          <p className="text-3xl font-extrabold text-accent mb-2">+{pointsEarned} points</p>
          <p className="text-muted mb-8">Thank you for your purchase!</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-10 py-4 bg-accent text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            Awesome! 🎉
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
          <h2 className="text-xl font-bold text-text mb-2">Scan Failed</h2>
          <p className="text-muted mb-6">{error || 'Invalid QR code'}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRetry}
            className="px-8 py-3 bg-accent text-white font-bold rounded-2xl"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface p-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Scan Receipt</h1>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-white rounded-xl text-muted font-medium"
        >
          Cancel
        </button>
      </div>

      <div className="bg-white rounded-3xl p-4 shadow-card">
        <div id="qr-reader" className="w-full" />
        
        {phase === 'verifying' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted font-medium">Verifying your receipt...</p>
          </div>
        )}

        {phase === 'scanning' && (
          <p className="text-center text-muted text-sm mt-4">
            Position the QR code within the frame
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
