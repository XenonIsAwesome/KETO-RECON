import type { Restaurant } from './types';

export interface RankedRestaurant extends Restaurant {
  rank: number;
  position: number;
}

export function rankRestaurants(
  restaurants: Restaurant[],
  weight: number,
): RankedRestaurant[] {
  if (restaurants.length === 0) return [];

  const w = Math.min(1, Math.max(0, weight));

  const distances = restaurants.map((r) => r.distance_km);
  const scores = restaurants.map((r) => r.keto_score);

  const dMin = Math.min(...distances);
  const dMax = Math.max(...distances);
  const kMin = Math.min(...scores);
  const kMax = Math.max(...scores);

  const dSpread = dMax - dMin;
  const kSpread = kMax - kMin;

  const ranked: RankedRestaurant[] = restaurants.map((r) => {
    const proximityNorm = dSpread === 0 ? 0.5 : 1 - (r.distance_km - dMin) / dSpread;
    const ketoNorm = kSpread === 0 ? 0.5 : (r.keto_score - kMin) / kSpread;
    const rank = w * ketoNorm + (1 - w) * proximityNorm;
    return { ...r, rank, position: 0 };
  });

  ranked.sort((a, b) => b.rank - a.rank);
  ranked.forEach((r, i) => {
    r.position = i + 1;
  });

  return ranked;
}
