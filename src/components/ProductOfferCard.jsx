import { motion } from 'framer-motion';
import { Package, Lock, Crown, Tag } from 'lucide-react';

// Helper function to display price info with discounts
const DisplayPriceInfo = ({ product }) => {
  // Check if product has offer details with discount percentage
  const hasDiscount = product.original_price !== null && product.original_price !== undefined &&
                      product.discount_percentage !== null && product.discount_percentage !== undefined &&
                      product.discount_percentage > 0;

  if (hasDiscount) {
    const discountAmount = product.original_price * (product.discount_percentage / 100);
    const discountedPrice = product.original_price - discountAmount;
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-red-500 line-through text-xs font-bold opacity-70">
            {product.original_price?.toLocaleString()} دج
          </span>
          <div className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
            -{product.discount_percentage}%
          </div>
        </div>
        <span className="text-green-600 font-black text-xl leading-none">
          {discountedPrice?.toLocaleString()} <span className="text-xs uppercase">دج</span>
        </span>
      </div>
    );
  } else if (product.price) {
    return <span className="text-text font-black text-lg">{product.price?.toLocaleString()} دج</span>;
  }
  return null;
};

export default function ProductOfferCard({ product, onProductClick }) {
  const hasActiveOfferDiscount = product.original_price !== null && product.original_price !== undefined &&
                                 product.discount_percentage !== null && product.discount_percentage !== undefined &&
                                 product.discount_percentage > 0;

  return (
    <motion.div
      whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onProductClick}
      className={`group relative bg-white rounded-3xl overflow-hidden border border-border shadow-soft cursor-pointer flex transition-all duration-300
                 ${hasActiveOfferDiscount ? 'ring-2 ring-green-500/20' : ''}
                `}
    >
      {/* Product Image Section */}
      <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden bg-surface">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted/20">
            <Package size={32} />
          </div>
        )}
        
        {/* Discount Overlay Tag */}
        {hasActiveOfferDiscount && (
          <div className="absolute top-0 right-0 p-2">
            <div className="bg-green-600 text-white p-1.5 rounded-full shadow-lg">
              <Tag size={12} fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Product Info Section */}
      <div className="p-4 flex-1 flex flex-col justify-center gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-text line-clamp-1">{product.name}</h4>
            {product.is_exclusive && (
              <Lock size={12} className="text-yellow-500" />
            )}
          </div>
          
          {/* Price and Discount Display */}
          <DisplayPriceInfo product={product} />
        </div>

        {/* Action Hint */}
        <div className="flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          <span>اطلب الآن</span>
          <span className="text-lg">←</span>
        </div>
      </div>
      
      {/* Premium Glow Effect for Discounts */}
      {hasActiveOfferDiscount && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/10 to-transparent rounded-3xl -z-10 blur-sm" />
      )}
    </motion.div>
  );
}

