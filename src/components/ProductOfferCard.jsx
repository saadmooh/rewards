import { motion } from 'framer-motion';
import { Package, Lock, Crown, Tag, Gift, Zap, Star } from 'lucide-react';

const DisplayPriceInfo = ({ product, offerType }) => {
  const hasDiscount = product.original_price !== null && product.original_price !== undefined &&
                      product.discount_percentage !== null && product.discount_percentage !== undefined &&
                      product.discount_percentage > 0;

  if (offerType === 'gift') {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
          <Gift size={10} fill="currentColor" />
          <span>مجاناً</span>
        </div>
      </div>
    );
  }

  if (offerType === 'double_points') {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
          <Star size={10} fill="currentColor" />
          <span>نقاط مضاعفة</span>
        </div>
        {product.price && (
          <span className="text-text font-bold text-sm">{product.price?.toLocaleString()} دج</span>
        )}
      </div>
    );
  }

  if (offerType === 'flash') {
    if (hasDiscount) {
      const discountAmount = product.original_price * (product.discount_percentage / 100);
      const discountedPrice = product.original_price - discountAmount;
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-red-500 line-through text-xs font-bold opacity-70">
              {product.original_price?.toLocaleString()} دج
            </span>
            <div className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter flex items-center gap-1">
              <Zap size={10} />
              -{product.discount_percentage}%
            </div>
          </div>
          <span className="text-green-600 font-black text-xl leading-none">
            {discountedPrice?.toLocaleString()} <span className="text-xs uppercase">دج</span>
          </span>
        </div>
      );
    }
    return product.price ? <span className="text-text font-black text-lg">{product.price?.toLocaleString()} دج</span> : null;
  }

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

const OfferTypeBadge = ({ offerType }) => {
  const badgeConfig = {
    flash: { icon: Zap, bg: 'bg-orange-500', text: 'Flash' },
    gift: { icon: Gift, bg: 'bg-amber-500', text: 'هدية' },
    double_points: { icon: Star, bg: 'bg-purple-600', text: '2x نقاط' },
    exclusive: { icon: Lock, bg: 'bg-yellow-500', text: 'حصري' },
    discount: { icon: Tag, bg: 'bg-green-600', text: 'خصم' },
  };

  const config = badgeConfig[offerType];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`${config.bg} text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1`}>
      <Icon size={8} fill="currentColor" />
      <span>{config.text}</span>
    </div>
  );
};

export default function ProductOfferCard({ product, onProductClick, offerType }) {
  const hasActiveOfferDiscount = product.original_price !== null && product.original_price !== undefined &&
                                 product.discount_percentage !== null && product.discount_percentage !== undefined &&
                                 product.discount_percentage > 0;

  const cardVariants = {
    gift: 'ring-2 ring-amber-500/30 border-amber-200',
    flash: 'ring-2 ring-orange-500/30 border-orange-200',
    double_points: 'ring-2 ring-purple-500/30 border-purple-200',
    exclusive: 'ring-2 ring-yellow-500/30 border-yellow-200',
    discount: hasActiveOfferDiscount ? 'ring-2 ring-green-500/20' : '',
  };

  return (
    <motion.div
      whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onProductClick}
      className={`group relative bg-white rounded-3xl overflow-hidden border border-border shadow-soft cursor-pointer flex transition-all duration-300
                 ${offerType ? cardVariants[offerType] : (hasActiveOfferDiscount ? 'ring-2 ring-green-500/20' : '')}
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
          <DisplayPriceInfo product={product} offerType={offerType} />
        </div>

        {/* Offer Type Badge */}
        {offerType && (
          <div className="mt-1">
            <OfferTypeBadge offerType={offerType} />
          </div>
        )}

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

