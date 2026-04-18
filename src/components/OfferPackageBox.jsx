import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useUserStore from '../store/userStore'
import { useOfferPackages } from '../hooks/useOfferPackages'

export default function OfferPackageBox() {
  const navigate = useNavigate()
  const { user, store } = useUserStore()
  const { packages, loading, openPackage } = useOfferPackages(user?.id, store?.id)
  const [canOpen, setCanOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const [opening, setOpening] = useState(false)

  const pkg = packages[0]

  useEffect(() => {
    if (!pkg?.offer_packages) return

    const waitHours = pkg.offer_packages.min_wait_hours || 0
    if (waitHours === 0) {
      setCanOpen(true)
      return
    }

    const createdAt = new Date(pkg.created_at)
    const unlockTime = new Date(createdAt.getTime() + waitHours * 60 * 60 * 1000)
    
    const checkTime = () => {
      const now = new Date()
      if (now >= unlockTime) {
        setCanOpen(true)
        return true
      }
      const diff = unlockTime - now
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeLeft({ hours, minutes })
      return false
    }

    if (!checkTime()) {
      const timer = setInterval(() => {
        if (checkTime()) clearInterval(timer)
      }, 60000)
      return () => clearInterval(timer)
    }
  }, [pkg])

  const handleOpen = async () => {
    if (!canOpen || opening) return
    setOpening(true)
    
    const result = await openPackage(pkg.id)
    setOpening(false)

    if (result) {
      navigate('/offers')
    }
  }

  if (loading || !pkg) return null

  const packageInfo = pkg.offer_packages

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="text-4xl">{packageInfo.icon || '🎁'}</div>
        <div className="flex-1">
          <h3 className="font-bold text-amber-800">{packageInfo.title}</h3>
          <p className="text-sm text-amber-600">{packageInfo.description}</p>
          
          {!canOpen && timeLeft && (
            <p className="text-xs text-amber-500 mt-1">
              Opens in {timeLeft.hours}h {timeLeft.minutes}m
            </p>
          )}
        </div>
        
        <button
          onClick={handleOpen}
          disabled={!canOpen || opening}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            canOpen 
              ? 'bg-amber-500 text-white hover:bg-amber-600' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {opening ? '...' : canOpen ? 'Open' : 'Wait'}
        </button>
      </div>
    </motion.div>
  )
}