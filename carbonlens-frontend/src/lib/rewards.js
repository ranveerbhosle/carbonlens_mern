export const BADGE_TIERS = [
  { min: 0, max: 50, badge: '🌱 Seedling', label: 'Seedling' },
  { min: 51, max: 150, badge: '🌿 Eco Starter', label: 'Eco Starter' },
  { min: 151, max: 300, badge: '🌳 Green Guardian', label: 'Green Guardian' },
  { min: 301, max: 500, badge: '♻️ Sustainability Hero', label: 'Sustainability Hero' },
  { min: 501, max: Infinity, badge: '🌍 Carbon Champion', label: 'Carbon Champion' },
];

export const getTierForCoins = (coins = 0) => {
  const c = Math.max(0, coins);
  return (
    BADGE_TIERS.find((t) => c >= t.min && c <= t.max) ||
    BADGE_TIERS[BADGE_TIERS.length - 1]
  );
};

export const getNextTier = (coins = 0) => {
  const c = Math.max(0, coins);
  const idx = BADGE_TIERS.findIndex((t) => c >= t.min && c <= t.max);
  if (idx === -1) return null;
  return BADGE_TIERS[idx + 1] || null;
};

export const progressToNextTierPct = (coins = 0) => {
  const cur = getTierForCoins(coins);
  const next = getNextTier(coins);
  if (!next) return 100;
  const span = next.min - cur.min;
  if (span <= 0) return 100;
  return ((coins - cur.min) / span) * 100;
};

