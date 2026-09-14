// Loads the Google Maps JavaScript API on demand. Every consumer (the map
// view, the distance service) should go through this rather than injecting
// their own <script> tag — the promise is cached so the SDK is only ever
// fetched once, and a missing/invalid key or a failed load rejects quickly
// so callers can fall back to OpenStreetMap instead of hanging.

const LOAD_TIMEOUT_MS = 10_000;

let loadPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Maps can only load in a browser'));
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured'));
      return;
    }

    if (window.google?.maps) {
      resolve(window.google);
      return;
    }

    const callbackName = '__ketoReconGoogleMapsLoaded';
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out loading the Google Maps script'));
    }, LOAD_TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timeoutId);
      delete (window as unknown as Record<string, unknown>)[callbackName];
    }

    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      cleanup();
      if (window.google?.maps) resolve(window.google);
      else reject(new Error('Google Maps script loaded without a usable google.maps object'));
    };

    const script = document.createElement('script');
    script.async = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&loading=async&callback=${callbackName}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('Failed to load the Google Maps script'));
    };
    document.head.appendChild(script);
  });

  // Don't cache a rejection — a transient failure (network blip) shouldn't
  // permanently pin this session to the OSM fallback if something calls
  // loadGoogleMaps() again later.
  loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}
