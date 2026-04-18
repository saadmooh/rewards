import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import useUserStore from '../store/userStore'
import { useScratchCards } from '../hooks/useScratchCards'
import ScratchCard from '../components/ScratchCard'

export default function ScratchCardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, membership, store } = useUserStore()
  const [revealedCard, setRevealedCard] = useState(null)

  const { cards, loading, error, revealCard, redeemCard } = useScratchCards(
    user?.id,
    store?.id
  )

  const calculateTimeLeft = (expiry) => {
    if (!expiry) return null
    const diff = new Date(expiry) - new Date()
    if (diff <= 0) return null
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    }
  }

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(revealedCard?.expires_at))

  useEffect(() => {
    if (revealedCard?.expires_at) {
      setTimeLeft(calculateTimeLeft(revealedCard.expires_at))

      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft(revealedCard.expires_at))
      }, 60000)

      return () => clearInterval(timer)
    }
  }, [revealedCard])

  const handleReveal = async (claim) => {
    const revealed = await revealCard(claim.id)
    if (revealed) {
      setRevealedCard({
        ...claim,
        scratch_cards: revealed.scratch_cards,
      })
    }
  }

  const handleRedeem = async () => {
    if (!revealedCard) return

    const result = await redeemCard(revealedCard.id)
    if (result?.success) {
      await membership?.refreshMembership?.()
      navigate('/profile')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 mb-4">{t('common.error')}: {error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-accent text-white rounded-lg"
        >
          {t('common.go_home')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="bg-gradient-to-b from-accent/20 to-transparent p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted mb-4"
        >
          ← {t('common.back')}
        </button>
        <h1 className="text-2xl font-bold text-foreground">{t('scratch_card.title')}</h1>
        <p className="text-muted mt-1">{t('scratch_card.subtitle')}</p>
      </div>

      <div className="p-4">
        {cards.length === 0 && !revealedCard ? (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {t('scratch_card.no_cards')}
            </h2>
            <p className="text-muted">{t('scratch_card.check_back')}</p>
          </Motion.div>
        ) : revealedCard ? (
          <div className="space-y-6">
            <ScratchCard
              rewardType={revealedCard.scratch_cards?.reward_type}
              rewardValue={revealedCard.scratch_cards?.reward_value}
              rewardMetadata={revealedCard.scratch_cards?.reward_metadata}
              isRevealed={true}
              onClick={handleRedeem}
            />

            {timeLeft && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-amber-800 font-medium">
                  {t('scratch_card.expires_in')}: {timeLeft.hours} {t('scratch_card.hours')} {timeLeft.minutes} {t('scratch_card.minutes')}
                </p>
              </div>
            )}

            <button
              onClick={handleRedeem}
              className="w-full py-4 bg-accent text-white font-bold rounded-xl text-lg"
            >
              {t('scratch_card.redeem')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((claim) => (
              <Motion.div
                key={claim.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-border"
              >
                <h3 className="font-semibold text-foreground mb-2">
                  {claim.scratch_cards?.title}
                </h3>
                {claim.scratch_cards?.description && (
                  <p className="text-muted text-sm mb-4">
                    {claim.scratch_cards.description}
                  </p>
                )}
                <ScratchCard
                  rewardType={claim.scratch_cards?.reward_type}
                  rewardValue={claim.scratch_cards?.reward_value}
                  rewardMetadata={claim.scratch_cards?.reward_metadata}
                  surfaceColor={claim.scratch_cards?.surface_color}
                  onReveal={() => handleReveal(claim)}
                />
              </Motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
