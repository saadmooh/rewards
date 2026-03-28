import { motion } from 'framer-motion'
import useUserStore from '../store/userStore'
import { useTransactions } from '../hooks/useTransactions'

export default function History() {
  const { user } = useUserStore()
  const { transactions, loading } = useTransactions()

  const totalEarned = transactions
    ?.filter(t => t.type === 'earn')
    .reduce((sum, t) => sum + t.points, 0) || 0

  const purchaseCount = transactions?.filter(t => t.type === 'earn').length || 0

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const groupedTransactions = transactions?.reduce((groups, tx) => {
    const date = new Date(tx.created_at).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(tx)
    return groups
  }, {}) || {}

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="p-5 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-text">History</h1>
        </motion.div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 text-center shadow-card"
          >
            <p className="text-2xl font-bold text-text">{user?.points || 0}</p>
            <p className="text-xs text-muted">Current</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 text-center shadow-card"
          >
            <p className="text-2xl font-bold text-success">+{totalEarned}</p>
            <p className="text-xs text-muted">Earned</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 text-center shadow-card"
          >
            <p className="text-2xl font-bold text-accent">{purchaseCount}</p>
            <p className="text-xs text-muted">Purchases</p>
          </motion.div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date}>
                <p className="text-muted text-sm font-medium mb-2">{date}</p>
                {txs.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
            ))}
            
            {Object.keys(groupedTransactions).length === 0 && (
              <div className="text-center py-12 text-muted">
                <p className="text-4xl mb-4">📊</p>
                <p>No transactions yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TransactionItem({ transaction }) {
  const isEarn = transaction.type === 'earn'
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl p-4 flex items-center justify-between mb-2 shadow-card"
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          isEarn ? 'bg-accent-light' : 'bg-red-50'
        }`}>
          <span className={`text-lg ${isEarn ? 'text-accent' : 'text-error'}`}>
            {isEarn ? '+' : '-'}
          </span>
        </div>
        <div>
          <p className="text-text font-semibold">{transaction.note}</p>
          <p className="text-muted text-xs">
            {new Date(transaction.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
      </div>
      <p className={`font-bold ${isEarn ? 'text-success' : 'text-error'}`}>
        {isEarn ? '+' : ''}{transaction.points} pts
      </p>
    </motion.div>
  )
}
