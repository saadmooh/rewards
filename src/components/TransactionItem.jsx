import { motion } from 'framer-motion';

function TransactionItem({
  id,
  type,
  amount,
  description,
  date,
  balance,
}) {
  const isEarned = type === 'earned';
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: '1px solid #f0f0f0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: isEarned ? '#E8F5E9' : '#FFF3E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          {isEarned ? '+' : '-'}
        </div>
        
        <div>
          <p
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              margin: '0 0 4px 0',
            }}
          >
            {description}
          </p>
          <p
            style={{
              fontSize: '12px',
              color: '#888',
              margin: 0,
            }}
          >
            {date}
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <p
          style={{
            fontSize: '16px',
            fontWeight: '700',
            color: isEarned ? '#4CAF50' : '#F57C00',
            margin: '0 0 4px 0',
          }}
        >
          {isEarned ? '+' : '-'}{amount} pts
        </p>
        {balance !== undefined && (
          <p
            style={{
              fontSize: '11px',
              color: '#999',
              margin: 0,
            }}
          >
            Balance: {balance}
          </p>
        )}
      </div>
    </motion.article>
  );
}

export default TransactionItem;