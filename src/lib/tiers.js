export const TIERS = {
  BRONZE: {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    multiplier: 1,
  },
  SILVER: {
    id: 'silver',
    name: 'Silver',
    minPoints: 1000,
    multiplier: 1.5,
  },
  GOLD: {
    id: 'gold',
    name: 'Gold',
    minPoints: 5000,
    multiplier: 2,
  },
  PLATINUM: {
    id: 'platinum',
    name: 'Platinum',
    minPoints: 15000,
    multiplier: 3,
  },
  DIAMOND: {
    id: 'diamond',
    name: 'Diamond',
    minPoints: 50000,
    multiplier: 5,
  },
};

export const TIER_ORDER = [
  TIERS.BRONZE.id,
  TIERS.SILVER.id,
  TIERS.GOLD.id,
  TIERS.PLATINUM.id,
  TIERS.DIAMOND.id,
];

export function getTierById(id) {
  return Object.values(TIERS).find(tier => tier.id === id) || TIERS.BRONZE;
}

export function getTierByPoints(points) {
  let currentTier = TIERS.BRONZE;
  for (const tierId of TIER_ORDER) {
    const tier = TIERS[tierId.toUpperCase()];
    if (points >= tier.minPoints) {
      currentTier = tier;
    }
  }
  return currentTier;
}

export function getNextTier(currentTierId) {
  const currentIndex = TIER_ORDER.indexOf(currentTierId);
  if (currentIndex < TIER_ORDER.length - 1) {
    return TIERS[TIER_ORDER[currentIndex + 1].toUpperCase()];
  }
  return null;
}

export function getPointsToNextTier(points, currentTierId) {
  const nextTier = getNextTier(currentTierId);
  if (!nextTier) return null;
  return nextTier.minPoints - points;
}

export function calculateRewards(points, tierId) {
  const tier = getTierById(tierId);
  return Math.floor(points * tier.multiplier);
}
