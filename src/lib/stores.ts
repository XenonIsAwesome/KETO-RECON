import { writable, derived, type Readable } from 'svelte/store';
import type { Trip } from './types';
import { rankRestaurants, type RankedRestaurant } from './ranking';

export const trip = writable<Trip | null>(null);
export const sliderWeight = writable(0.5);
export const selectedId = writable<string | null>(null);

export const rankedRestaurants: Readable<RankedRestaurant[]> = derived(
  [trip, sliderWeight],
  ([$trip, $sliderWeight]) => ($trip ? rankRestaurants($trip.restaurants, $sliderWeight) : []),
);
