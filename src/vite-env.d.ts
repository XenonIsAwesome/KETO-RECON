/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Google Maps JavaScript API key (restricted by HTTP referrer in Google
   * Cloud Console). When unset, or when the Google Maps script fails to
   * load for any reason, the app falls back to Leaflet + OpenStreetMap.
   */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
