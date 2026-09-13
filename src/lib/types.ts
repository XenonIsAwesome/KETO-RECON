export interface Hotel {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

export interface Restaurant {
  id: string;
  name: string;
  website_url: string;
  menu_url_he: string | null;
  image_url: string;
  lat: number;
  lng: number;
  google_rating: number;
  keto_score: number;
  description: string;
  distance_km: number;
  taxi_fare_day: number;
  taxi_fare_night: number;
  currency: string;
}

export interface Trip {
  location_name: string;
  hotel: Hotel;
  restaurants: Restaurant[];
}

export interface ManifestEntry {
  slug: string;
  location_name: string;
}
