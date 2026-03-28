import { motion } from 'framer-motion'

export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 bg-accent-light rounded-3xl flex items-center justify-center mx-auto mb-6"
        >
          <span className="text-4xl">👕</span>
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-text mb-2"
        >
          Loyalty App
        </motion.h1>
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="h-1 bg-accent rounded-full mx-auto"
        />
      </motion.div>
    </div>
  )
}
