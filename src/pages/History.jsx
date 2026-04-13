import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import useUserStore from '../store/userStore'
import { useTransactions } from '../hooks/useTransactions'

export default function History() {
  const { t } = useTranslation()
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
    <div className="min-h-screen bg-white pb-24">
      <div className="p-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-text text-right">{t('history.title')}</h1>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 text-center shadow-soft border border-border hover:shadow-lg transition-shadow"
          >
            <p className="text-3xl font-black text-accent">{(user?.points || 0).toLocaleString()}</p>
            <p className="text-xs font-bold text-muted mt-1 uppercase tracking-widest">{t('history.current_balance')}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 text-center shadow-soft border border-border hover:shadow-lg transition-shadow"
          >
            <p className="text-3xl font-black text-green-600">+{totalEarned.toLocaleString()}</p>
            <p className="text-xs font-bold text-muted mt-1 uppercase tracking-widest">{t('history.total_earned')}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 text-center shadow-soft border border-border hover:shadow-lg transition-shadow"
          >
            <p className="text-3xl font-black text-text">{purchaseCount}</p>
            <p className="text-xs font-bold text-muted mt-1 uppercase tracking-widest">{t('history.transaction_count')}</p>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8 max-w-2xl mx-auto">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date}>
                <div className="flex items-center gap-4 mb-4">
                   <div className="h-[1px] flex-1 bg-border" />
                   <p className="text-muted text-xs font-black uppercase tracking-widest">{new Date(date).toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                   <div className="h-[1px] flex-1 bg-border" />
                </div>
                <div className="space-y-3">
                  {txs.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))}
                </div>
              </div>
            ))}
            
            {Object.keys(groupedTransactions).length === 0 && (
              <div className="text-center py-24 bg-surface rounded-3xl border border-dashed border-border">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
                   <span className="text-3xl">📊</span>
                </div>
                <p className="text-muted font-bold">{t('history.no_transactions')}</p>
                <button onClick={() => window.location.href = '/'} className="mt-4 text-accent font-bold hover:underline">{t('history.start_shopping')}</button>
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
