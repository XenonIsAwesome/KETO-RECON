// Recalculates hotel→restaurant distance using Google's Distance Matrix
// (real driving distance, matching how the taxi_fare fields are framed)
// instead of the straight-line/OSM-derived value baked into the trip data.
//
// The static distance_km already in the JSON is treated as the OSM
// fallback: it's kept as-is whenever Google Maps can't load (no API key,
// network failure, quota) or can't resolve a specific route, rather than
// this ever blocking or erroring the trip view.

import { loadGoogleMaps } from './googleMaps';
import type { Trip } from './types';

// The client-side Distance Matrix service caps a single request at 25
// destinations; batch beyond that rather than fail outright for larger trips.
const MAX_DESTINATIONS_PER_REQUEST = 25;

interface LatLng {
  lat: number;
  lng: number;
}

async function drivingDistancesKm(
  origin: LatLng,
  destinations: Array<{ id: string } & LatLng>,
): Promise<Map<string, number>> {
  const google = await loadGoogleMaps();
  const service = new google.maps.DistanceMatrixService();
  const results = new Map<string, number>();

  for (let i = 0; i < destinations.length; i += MAX_DESTINATIONS_PER_REQUEST) {
    const batch = destinations.slice(i, i + MAX_DESTINATIONS_PER_REQUEST);
    const response = await service.getDistanceMatrix({
      origins: [origin],
      destinations: batch.map((d) => ({ lat: d.lat, lng: d.lng })),
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
    });

    const row = response.rows[0];
    batch.forEach((d, index) => {
      const element = row?.elements[index];
      // Anything other than OK (NOT_FOUND, ZERO_RESULTS, etc.) is left
      // out of the map, so the caller keeps that restaurant's fallback
      // distance instead of a wrong or missing value.
      if (element?.status === 'OK' && element.distance) {
        results.set(d.id, element.distance.value / 1000);
      }
    });
  }

  return results;
}

/**
 * Returns a copy of `trip` with each restaurant's distance_km replaced by
 * Google's driving distance from the hotel, wherever that resolved
 * successfully. Restaurants Google couldn't resolve — and the whole trip,
 * if Google Maps isn't available at all — keep their original (OSM
 * fallback) distance_km unchanged.
 */
export async function refineTripDistances(trip: Trip): Promise<Trip> {
  let km: Map<string, number>;
  try {
    km = await drivingDistancesKm(
      trip.hotel,
      trip.restaurants.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng })),
    );
  } catch {
    return trip;
  }

  if (km.size === 0) return trip;

  return {
    ...trip,
    restaurants: trip.restaurants.map((r) =>
      km.has(r.id) ? { ...r, distance_km: km.get(r.id)! } : r,
    ),
  };
}
