import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useUserStore from '../store/userStore'
import { useOffer } from '../hooks/useOffers'
import { supabase } from '../lib/supabase' // Import supabase client
import { QRCodeCanvas } from 'qrcode.react'; // Import QRCodeCanvas
import { Crown, Package, Lock } from 'lucide-react'; // Import icons for exclusivity/tier

const OFFER_COUPON_EXPIRY_SECONDS = 86400; // 24 hours expiry for offer coupon

export default function OfferDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, redeemOffer } = useUserStore()
  const { offer, loading, error: offerError } = useOffer(id)
  const [showConfirm, setShowConfirm] = useState(false)
  const [redeemed, setRedeemed] = useState(false)
  const [coupon, setCoupon] = useState(null)
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [couponExpiry, setCouponExpiry] = useState(null);
  const timerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(OFFER_COUPON_EXPIRY_SECONDS);

  // Fetch products associated with the offer
  useEffect(() => {
    const fetchOfferProducts = async () => {
      if (!offer?.id) return;
      setProductsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id, name, price, image_url,
            original_price, discount_percentage,
            is_exclusive, min_tier_to_view
          `)
          .neq('id', null) 
          .or(`id.in.(SELECT product_id FROM offer_products WHERE offer_id='${offer.id}')`);
        
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching offer products:', err.message);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchOfferProducts();
  }, [offer?.id]);

  const handleRedeem = async () => {
    if (!offer) return;
    
    const pointsCost = offer.points_cost || 0;
    if (pointsCost > 0 && (!user || user.points < pointsCost)) {
       alert("You don't have enough points to redeem this offer.");
       return;
    }

    const result = await redeemOffer(offer.id, pointsCost);
    if (result?.coupon_code) {
      setCoupon(result.coupon_code);
      setRedeemed(true);
      setCouponExpiry(new Date(Date.now() + OFFER_COUPON_EXPIRY_SECONDS * 1000));
    } else {
      console.error("Redemption failed or no coupon code generated.");
      alert("Failed to redeem offer. Please check your points balance or try again later.");
    }
  };

  const confirmRedeem = async () => {
    const result = await redeemOffer(offer.id, offer.points_cost || 0);
    if (result?.coupon_code) {
      setCoupon(result.coupon_code);
      setRedeemed(true);
      setCouponExpiry(new Date(Date.now() + OFFER_COUPON_EXPIRY_SECONDS * 1000));
    } else {
      console.error("Redemption failed or no coupon code generated.");
      alert("Failed to redeem offer. Please check your points balance or try again later.");
    }
    setShowConfirm(false);
  };

  // Timer for coupon expiry
  useEffect(() => {
    if (redeemed && couponExpiry) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const remaining = Math.floor((couponExpiry - new Date()) / 1000);
          if (remaining <= 0) {
            clearInterval(timerRef.current);
            return 0;
          }
          return remaining;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [redeemed, couponExpiry]);

  const formatTime = (s) => {
    const minutes = Math.floor(s/60);
    const seconds = s % 60;
    return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  };

  // Function to display price information, handling discounts
  const displayPriceInfo = (product) => {
    if (product.original_price && product.discount_percentage !== null && product.discount_percentage !== undefined) {
      const discountAmount = product.original_price * (product.discount_percentage / 100);
      const discountedPrice = product.original_price - discountAmount;
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted line-through text-sm">{product.original_price?.toLocaleString()} دج</span>
          <span className="text-accent font-black text-base">{discountedPrice?.toLocaleString()} دج</span>
          <span className="text-xs text-green-600 font-bold">-{product.discount_percentage}%</span>
        </div>
      );
    } else if (product.price) {
      return <span className="text-accent font-black text-base">{product.price?.toLocaleString()} دج</span>;
    }
    return null;
  };

  if (loading || productsLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (offerError || !offer) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">Offer not found or failed to load.</p>
          <button onClick={() => navigate(-1)} className="text-accent">Go back</button>
        </div>
      </div>
    )
  }

  if (redeemed && coupon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-light to-white p-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="max-w-md mx-auto text-center py-12"
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-5xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">Offer Activated!</h2>
          <p className="text-muted mb-6">{offer.title}</p>
          
          <div className="bg-white rounded-3xl p-6 mb-6 shadow-card">
            <p className="text-muted text-sm mb-2">Show this code to the cashier</p>
            
            {timeLeft > 0 ? (
              <>
                <QRCodeCanvas value={coupon} size={200} level="H" includeMargin={true} />
                <p className="text-sm text-muted mt-2">Valid for {formatTime(timeLeft)}</p>
              </>
            ) : (
              <div className="text-center">
                <p className="text-red-500 font-bold">Code Expired</p>
                <p className="text-sm text-muted mt-2">Please redeem the offer again.</p>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/offers')} // Navigate to offers page or home
            className="px-10 py-4 bg-accent text-white font-bold rounded-2xl shadow-lg"
          >
            Done
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface p-5">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 mb-4"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl overflow-hidden shadow-card"
        >
          <div className="h-40 bg-gradient-to-br from-accent-light to-surface" />
          
          <div className="p-6">
            <span className="px-3 py-1 bg-accent-light text-accent-dark rounded-full text-xs font-semibold">
              {offer.type}
            </span>
            
            <h1 className="text-2xl font-bold text-text mt-3 mb-2">
              {offer.title}
            </h1>
            
            <p className="text-muted mb-6">
              {offer.description}
            </p>

            <div className="flex items-center justify-between text-sm mb-6">
              <div>
                <p className="text-muted">Points Required</p>
                <p className="text-text font-bold text-lg">{offer.points_cost ? `${offer.points_cost} pts` : 'Free'}</p>
              </div>
              <div className="text-right">
                <p className="text-muted">Expires</p>
                <p className="text-text font-semibold">
                  {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Display Associated Products */}
            {!productsLoading && products.length > 0 && (
              <div className="mt-6 border-t border-surface pt-6">
                <h3 className="text-lg font-bold text-text mb-3">Included Products:</h3>
                <div className="space-y-4">
                  {products.map((product, index) => (
                    // Product Card Structure mimicking ProductCard.jsx with added interactivity and badges
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/products/${product.id}`)} // Add navigation to product detail
                      className="bg-white rounded-2xl overflow-hidden shadow-card cursor-pointer"
                    >
                      <div className="flex">
                        {/* Product Image Section */}
                        <div className="relative w-24 h-24 flex-shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-tl-2xl" />
                          ) : (
                            <div className="w-full h-full bg-surface rounded-tl-2xl flex items-center justify-center text-muted/20">
                               <Package size={32} /> {/* Placeholder icon */}
                            </div>
                          )}
                          {/* Exclusivity Badge */}
                          {product.is_exclusive && (
                            <div className="absolute top-1 right-1 p-1 bg-yellow-400/80 backdrop-blur-sm rounded-md z-10">
                              <Lock size={14} className="text-white" />
                            </div>
                          )}
                        </div>

                        {/* Product Info Section */}
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-black text-text truncate flex-grow">{product.name}</h4>
                                {/* Tier indicator if min_tier_to_view is relevant and not 'basic' */}
                                {product.min_tier_to_view && product.min_tier_to_view.toLowerCase() !== 'basic' && (
                                    <div className="flex items-center ml-2 flex-shrink-0">
                                        <Crown size={12} className="text-yellow-500" />
                                        <span className="text-[10px] font-black text-yellow-600 uppercase ml-0.5">{product.min_tier_to_view}</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Price and Discount Display */}
                            <div className="price-section">
                              {displayPriceInfo(product)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {productsLoading && (
              <div className="mt-6 border-t border-surface pt-6">
                 <h3 className="text-lg font-bold text-text mb-3">Included Products:</h3>
                 <div className="animate-pulse space-y-4">
                   {[1,2].map(i => (
                     <div key={i} className="flex items-center gap-4">
                       <div className="w-24 h-24 rounded-lg bg-surface flex-shrink-0" />
                       <div className="flex-1 space-y-2">
                         <div className="h-3 bg-surface rounded w-3/4"/>
                         <div className="h-3 bg-surface rounded w-1/2"/>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}


            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRedeem}
              disabled={offer.points_cost && (!user || user.points < offer.points_cost)} // Disable if not enough points or no user
              className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg mt-6 
                ${(offer.points_cost && (!user || user.points < offer.points_cost)) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-accent text-white hover:shadow-xl'
                }`}
            >
              {offer.points_cost ? `Redeem for ${offer.points_cost} pts` : 'Activate Offer'}
            </motion.button>
          </div>
        </motion.div>

        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full"
            >
              <h3 className="text-xl font-bold text-text mb-2">Confirm Redemption</h3>
              <p className="text-muted mb-6">
                {offer.points_cost 
                  ? `Are you sure you want to use ${offer.points_cost} points from your balance?`
                  : 'Confirm activation of this offer?'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-surface text-text rounded-2xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRedeem}
                  className="flex-1 py-3 bg-accent text-white font-bold rounded-2xl"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
