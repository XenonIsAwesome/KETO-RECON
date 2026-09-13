import type { Localized } from './language';

export interface Hotel {
  name: Localized;
  lat: number;
  lng: number;
  address: string;
}

export interface Restaurant {
  id: string;
  name: Localized;
  website_url: string;
  menu_url_he: string | null;
  image_url: string;
  lat: number;
  lng: number;
  google_rating: number;
  keto_score: number;
  description: Localized;
  distance_km: number;
  taxi_fare_day: number;
  taxi_fare_night: number;
  currency: string;
}

export interface Trip {
  location_name: Localized;
  hotel: Hotel;
  restaurants: Restaurant[];
}

export interface ManifestEntry {
  slug: string;
  location_name: Localized;
}
