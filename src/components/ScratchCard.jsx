import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export default function ScratchCard({
  rewardType,
  rewardValue,
  rewardMetadata,
  surfaceColor = '#8A9A8A',
  onReveal,
  onClick,
  isRevealed = false,
}) {
  const { t } = useTranslation()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [revealed, setRevealed] = useState(isRevealed)
  const [isDrawing, setIsDrawing] = useState(false)
  const [canvasSize, setCanvasSize] = useState(300)

  const clearCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        setCanvasSize(width)
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  if (isRevealed && !revealed) {
    setRevealed(true)
  }

  useEffect(() => {
    if (revealed) {
      clearCanvas()
    }
  }, [revealed])

  useEffect(() => {
    if (!revealed && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = surfaceColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add pattern or texture to the surface
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      for (let i = 0; i < canvas.width; i += 20) {
        for (let j = 0; j < canvas.height; j += 20) {
          ctx.beginPath()
          ctx.arc(i, j, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.font = `bold ${canvasSize * 0.2}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🎁', canvas.width / 2, canvas.height / 2 - canvasSize * 0.05)
      ctx.font = `${canvasSize * 0.06}px sans-serif`
      ctx.fillText(t('scratch_card.scratch_here'), canvas.width / 2, canvas.height / 2 + canvasSize * 0.1)
    }
  }, [revealed, surfaceColor, canvasSize, t])

  const getScratchedPercent = () => {
    if (!canvasRef.current) return 0
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparent = 0

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++
    }

    return Math.round((transparent / (pixels.length / 4)) * 100)
  }

  const scratch = (e, isInitial = false) => {
    if (!isInitial && !isDrawing) return
    if (revealed) return

    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top

    const ctx = canvas.getContext('2d')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, canvasSize * 0.18, 0, Math.PI * 2)
    ctx.fill()

    const percent = getScratchedPercent()

    if (percent > 15 && !revealed) {
      handleReveal()
    }
  }

  const handleReveal = () => {
    if (revealed) return
    setRevealed(true)
    if (onReveal) onReveal()
  }

  const handleMouseDown = (e) => {
    if (revealed) return
    setIsDrawing(true)
    scratch(e, true) // Force scratch on initial touch
  }

  const handleMouseMove = (e) => {
    scratch(e)
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleCardClick = () => {
    if (!revealed) {
      handleReveal()
    } else if (onClick) {
      onClick()
    }
  }

  const getRewardText = () => {
    switch (rewardType) {
      case 'points':
        return `${rewardValue} ${t('common.points')}`
      case 'discount':
        return `${rewardValue}% ${t('scratch_card.discount')}`
      case 'gift':
        return rewardMetadata?.productName || t('scratch_card.gift')
      case 'double_points':
        return t('scratch_card.double_points')
      case 'package':
        return rewardMetadata?.packageTitle || 'Mystery Box'
      default:
        return `${rewardValue}`
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full max-w-sm mx-auto"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl border border-border transition-transform active:scale-95 duration-200">
        <div className="aspect-square relative">
          {!revealed ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-quartz/20 to-sage/20">
                <div className="text-center">
                  <div className="text-6xl mb-2">✨</div>
                  <p className="text-accent-dark font-semibold">{t('scratch_card.subtitle')}</p>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                className="absolute inset-0 touch-none cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-rose-quartz/30 to-sage/30 p-6 text-center">
              <div className="text-7xl mb-4 animate-bounce">🌸</div>
              <p className="text-2xl font-bold text-accent-dark mb-2">
                {t('scratch_card.congratulations')}
              </p>
              <p className="text-lg text-accent-dark/70">{t('scratch_card.you_won')}</p>
              <p className="text-4xl font-bold text-accent-dark mt-2 break-words max-w-full leading-tight">
                {getRewardText()}
              </p>
              <div className="mt-4 px-6 py-2 bg-accent text-white text-sm font-black rounded-full shadow-lg shadow-accent/20 animate-pulse">
                {t('scratch_card.redeem')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
