import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

function CouponSheet({ isOpen, couponCode, onClose }) {
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
            alignItems: 'flex-end',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-title"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: '#ddd',
                borderRadius: '2px',
                margin: '0 auto 20px',
              }}
            />

            <h2
              id="sheet-title"
              style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 8px 0',
                color: '#333',
                textAlign: 'center',
              }}
            >
              Your Coupon
            </h2>

            <p
              style={{
                fontSize: '14px',
                color: '#666',
                margin: '0 0 24px 0',
                textAlign: 'center',
              }}
            >
              Show this QR code at checkout
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '20px',
                backgroundColor: '#fafafa',
                borderRadius: '12px',
                marginBottom: '16px',
              }}
            >
              <QRCodeSVG
                value={couponCode || 'COUPON'}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#333',
                textAlign: 'center',
                letterSpacing: '2px',
                marginBottom: '24px',
              }}
            >
              {couponCode}
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#9C27B0',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7B1FA2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9C27B0'}
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CouponSheet;
