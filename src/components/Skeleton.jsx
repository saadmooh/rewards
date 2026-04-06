import { motion } from 'framer-motion'

export default function Skeleton({ className, width, height, borderRadius = '1rem' }) {
  return (
    <motion.div
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={`bg-gray-200 ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
        borderRadius
      }}
    />
  )
}
