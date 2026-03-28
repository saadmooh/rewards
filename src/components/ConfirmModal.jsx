import { motion, AnimatePresence } from 'framer-motion';

function ConfirmModal({
  isOpen,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h2
              id="modal-title"
              style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 12px 0',
                color: '#333',
              }}
            >
              {title}
            </h2>

            <p
              style={{
                fontSize: '16px',
                color: '#666',
                margin: '0 0 24px 0',
                lineHeight: '1.5',
              }}
            >
              {message}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={onCancel}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: '#fff',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                {cancelText}
              </button>

              <button
                onClick={onConfirm}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isDestructive ? '#E53935' : '#9C27B0',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDestructive ? '#C62828' : '#7B1FA2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDestructive ? '#E53935' : '#9C27B0'}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmModal;