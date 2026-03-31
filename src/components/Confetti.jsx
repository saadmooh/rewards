import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'];
const CONFETTI_COUNT = 50;

function Confetti({ isActive = true, onComplete }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    const newParticles = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.5,
      delay: Math.random() * 0.5,
      duration: Math.random() * 1.5 + 1.5,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    }));
    setParticles(newParticles);

    const timeout = setTimeout(() => {
      onComplete?.();
    }, 2500);

    return () => clearTimeout(timeout);
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: `${particle.x}vw`,
            y: '-10vh',
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: '110vh',
            rotate: particle.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: '10px',
            height: '10px',
            backgroundColor: particle.color,
            borderRadius: particle.borderRadius,
            transform: `scale(${particle.scale})`,
          }}
        />
      ))}
    </div>
  );
}

export default Confetti;