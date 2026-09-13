import { describe, it, expect } from 'vitest';
import { rankRestaurants } from './ranking';
import type { Restaurant } from './types';

function makeRestaurant(overrides: Partial<Restaurant>): Restaurant {
  return {
    id: 'r',
    name: 'R',
    website_url: 'https://example.com',
    menu_url_he: null,
    image_url: 'https://example.com/img.jpg',
    lat: 0,
    lng: 0,
    google_rating: 4.0,
    keto_score: 5,
    description: 'desc',
    distance_km: 1,
    taxi_fare_day: 10,
    taxi_fare_night: 12,
    currency: 'ILS',
    ...overrides,
  };
}

describe('rankRestaurants', () => {
  it('returns an empty array for no restaurants', () => {
    expect(rankRestaurants([], 0.5)).toEqual([]);
  });

  it('assigns position 1 to a single restaurant regardless of weight', () => {
    const result = rankRestaurants([makeRestaurant({ id: 'only' })], 0.3);
    expect(result).toHaveLength(1);
    expect(result[0].position).toBe(1);
  });

  it('at weight=0, orders purely by ascending distance', () => {
    const near = makeRestaurant({ id: 'near', distance_km: 1, keto_score: 1 });
    const far = makeRestaurant({ id: 'far', distance_km: 5, keto_score: 9 });
    const result = rankRestaurants([far, near], 0);
    expect(result.map((r) => r.id)).toEqual(['near', 'far']);
  });

  it('at weight=1, orders purely by descending keto_score', () => {
    const lowKeto = makeRestaurant({ id: 'low', distance_km: 1, keto_score: 1 });
    const highKeto = makeRestaurant({ id: 'high', distance_km: 5, keto_score: 9 });
    const result = rankRestaurants([lowKeto, highKeto], 1);
    expect(result.map((r) => r.id)).toEqual(['high', 'low']);
  });

  it('at weight=0.5, blends distance and keto score', () => {
    // With 3 points, min-max normalization is no longer symmetric between
    // the two axes, so a restaurant that's only slightly farther but much
    // better on keto score can win an even blend.
    const close = makeRestaurant({ id: 'close', distance_km: 1, keto_score: 1 });
    const ketoWinner = makeRestaurant({ id: 'ketoWinner', distance_km: 2, keto_score: 10 });
    const filler = makeRestaurant({ id: 'filler', distance_km: 10, keto_score: 1 });
    const result = rankRestaurants([close, ketoWinner, filler], 0.5);
    expect(result[0].id).toBe('ketoWinner');
  });

  it('clamps out-of-range weights into [0, 1]', () => {
    const near = makeRestaurant({ id: 'near', distance_km: 1, keto_score: 1 });
    const far = makeRestaurant({ id: 'far', distance_km: 5, keto_score: 9 });
    const result = rankRestaurants([far, near], -3);
    expect(result.map((r) => r.id)).toEqual(['near', 'far']);
  });
});
