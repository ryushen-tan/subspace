/**
 * Paid tier constants. Stored as `tier` on the PocketBase users collection.
 * 0 = free, 1 = lowest paid, 2 = middle, 3 = highest.
 */
export const TIER_FREE = 0;
export const TIER_1 = 1; // lowest paid
export const TIER_2 = 2; // middle
export const TIER_3 = 3; // highest

export const TIER_VALUES = [TIER_FREE, TIER_1, TIER_2, TIER_3];

export const TIER_LABELS = {
  [TIER_FREE]: 'Free',
  [TIER_1]: 'Sub',
  [TIER_2]: 'Sub+',
  [TIER_3]: 'Sub++',
};

/**
 * @param {number} tier - user's tier (0–3)
 * @param {number} minTier - minimum tier required
 * @returns {boolean}
 */
export function hasTierOrAbove(tier, minTier) {
  const t = tier ?? TIER_FREE;
  return typeof t === 'number' && t >= minTier;
}
