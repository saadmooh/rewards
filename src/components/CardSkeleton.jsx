import Skeleton from './Skeleton'

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card w-full">
      <Skeleton height="9rem" borderRadius="0" />
      <div className="p-3">
        <Skeleton width="80%" height="1rem" className="mb-2" />
        <Skeleton width="40%" height="0.8rem" />
      </div>
    </div>
  )
}

export function OfferCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card w-full flex">
      <Skeleton width="6rem" height="6rem" borderRadius="0" />
      <div className="p-3 flex-1 flex flex-col justify-center">
        <Skeleton width="70%" height="1rem" className="mb-2" />
        <Skeleton width="40%" height="0.8rem" className="mb-2" />
        <Skeleton width="30%" height="1.2rem" />
      </div>
    </div>
  )
}
