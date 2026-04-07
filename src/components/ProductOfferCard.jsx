import { motion } from 'framer-motion';
import { Package, Lock, Tag } from 'lucide-react';

const DisplayPriceInfo = ({ product, offerType }) => {
  const hasDiscount = product.original_price !== null && product.original_price !== undefined &&
                      product.discount_percentage !== null && product.discount_percentage !== undefined &&
                      product.discount_percentage > 0;

  if (offerType === 'gift') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">مجاناً</span>
      </div>
    );
  }

  if (hasDiscount) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-red-400 line-through text-xs">
          {product.original_price?.toLocaleString()} دج
        </span>
        <span className="text-green-600 font-medium">
          {product.price?.toLocaleString()} دج
        </span>
      </div>
    );
  } else if (product.price) {
    return <span className="text-gray-900 font-medium text-sm">{product.price?.toLocaleString()} دج</span>;
  }
  return null;
};

const OfferTypeBadge = ({ offerType }) => {
  const badgeConfig = {
    flash: { bg: 'bg-gray-900', text: 'Flash' },
    gift: { bg: 'bg-gray-900', text: 'هدية' },
    double_points: { bg: 'bg-gray-900', text: '2x نقاط' },
    exclusive: { bg: 'bg-gray-900', text: 'حصري' },
    discount: { bg: 'bg-gray-900', text: 'خصم' },
  };

  const config = badgeConfig[offerType];
  if (!config) return null;

  return (
    <span className={`${config.bg} text-white text-[9px] font-medium px-2 py-0.5 rounded`}>
      {config.text}
    </span>
  );
};

export default function ProductOfferCard({ product, onProductClick, offerType }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onProductClick}
      className="bg-white rounded-xl overflow-hidden cursor-pointer flex transition-all"
    >
      <div className="w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-50">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package size={24} />
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col justify-center gap-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</h4>
          {product.is_exclusive && (
            <Lock size={10} className="text-gray-400" />
          )}
        </div>
        
        <DisplayPriceInfo product={product} offerType={offerType} />

        {offerType && (
          <div className="mt-1">
            <OfferTypeBadge offerType={offerType} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

