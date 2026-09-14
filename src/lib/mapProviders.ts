// Two interchangeable map backends behind one small interface, so
// MapView.svelte doesn't need to know which one ended up rendering.
//
// Google Maps is the primary provider (real map imagery, matches the
// driving-distance recalculation in distance.ts). OpenStreetMap via
// Leaflet is the fallback — used whenever Google Maps isn't available
// (no API key, network failure, quota) since it needs no key at all,
// even though its tile data is less accurate/detailed for this area.

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { loadGoogleMaps } from './googleMaps';
import {
  HOTEL_MARKER_COLOR,
  HOTEL_MARKER_SIZE,
  MARKER_ACCENT,
  MARKER_ACCENT_SELECTED,
  MARKER_MAX_SIZE,
  MARKER_MIN_SIZE,
  hotelMarkerSvg,
  restaurantMarkerSvg,
  svgDataUri,
} from './mapIcons';
import { t, type Language } from './language';
import type { RankedRestaurant } from './ranking';
import type { Trip } from './types';

export interface MapProviderHandle {
  renderHotel(trip: Trip | null, lang: Language): void;
  renderRestaurants(ranked: RankedRestaurant[], lang: Language): void;
  /** Recolor the selected marker and pan the camera to it. */
  setSelected(id: string | null): void;
  invalidateSize(): void;
  destroy(): void;
}

export interface MapProviderOptions {
  container: HTMLElement;
  onMarkerClick: (id: string) => void;
}

function sizeForPosition(position: number, maxPosition: number): number {
  if (maxPosition <= 1) return MARKER_MAX_SIZE;
  return MARKER_MAX_SIZE - ((position - 1) / (maxPosition - 1)) * (MARKER_MAX_SIZE - MARKER_MIN_SIZE);
}

// ---------------------------------------------------------------------------
// Leaflet + OpenStreetMap
// ---------------------------------------------------------------------------

export function mountLeafletProvider({ container, onMarkerClick }: MapProviderOptions): MapProviderHandle {
  const map = L.map(container);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  const markers = new Map<string, L.Marker>();
  const sizes = new Map<string, number>();
  let hotelMarker: L.Marker | null = null;
  let selectedId: string | null = null;

  const resizeObserver = new ResizeObserver(() => map.invalidateSize());
  resizeObserver.observe(container);

  function makeIcon(size: number, color: string): L.DivIcon {
    return L.divIcon({
      className: 'restaurant-marker',
      html: restaurantMarkerSvg(size, color),
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function makeHotelIcon(): L.DivIcon {
    return L.divIcon({
      className: 'hotel-marker',
      html: hotelMarkerSvg(),
      iconSize: [HOTEL_MARKER_SIZE, HOTEL_MARKER_SIZE],
      iconAnchor: [HOTEL_MARKER_SIZE / 2, HOTEL_MARKER_SIZE / 2],
    });
  }

  return {
    renderHotel(trip, lang) {
      if (!trip) return;
      map.setView([trip.hotel.lat, trip.hotel.lng], 14);
      if (hotelMarker) map.removeLayer(hotelMarker);
      hotelMarker = L.marker([trip.hotel.lat, trip.hotel.lng], { icon: makeHotelIcon() })
        .addTo(map)
        .bindPopup(`<strong>${t(trip.hotel.name, lang)}</strong>`);
    },

    renderRestaurants(ranked, lang) {
      const maxPos = ranked.length;
      const seen = new Set<string>();

      ranked.forEach((r) => {
        seen.add(r.id);
        const size = sizeForPosition(r.position, maxPos);
        sizes.set(r.id, size);
        const color = selectedId === r.id ? MARKER_ACCENT_SELECTED : MARKER_ACCENT;

        let marker = markers.get(r.id);
        if (!marker) {
          marker = L.marker([r.lat, r.lng], { icon: makeIcon(size, color) }).addTo(map);
          marker.on('click', () => onMarkerClick(r.id));
          markers.set(r.id, marker);
        } else {
          marker.setIcon(makeIcon(size, color));
        }
        marker.bindTooltip(t(r.name, lang));
      });

      for (const [id, marker] of markers) {
        if (!seen.has(id)) {
          map.removeLayer(marker);
          markers.delete(id);
          sizes.delete(id);
        }
      }
    },

    setSelected(id) {
      selectedId = id;
      for (const [markerId, marker] of markers) {
        const size = sizes.get(markerId) ?? MARKER_MIN_SIZE;
        marker.setIcon(makeIcon(size, markerId === id ? MARKER_ACCENT_SELECTED : MARKER_ACCENT));
      }
      if (id) {
        const marker = markers.get(id);
        if (marker) map.panTo(marker.getLatLng());
      }
    },

    invalidateSize() {
      map.invalidateSize();
    },

    destroy() {
      resizeObserver.disconnect();
      map.remove();
    },
  };
}

// ---------------------------------------------------------------------------
// Google Maps
// ---------------------------------------------------------------------------

// Uses the classic google.maps.Marker rather than AdvancedMarkerElement:
// the latter needs a Map ID configured in Cloud Console and buys nothing
// here (custom SVG icon, no need for the newer element's HTML content),
// and Marker remains fully supported despite being marked legacy.
export async function mountGoogleProvider({
  container,
  onMarkerClick,
}: MapProviderOptions): Promise<MapProviderHandle> {
  const google = await loadGoogleMaps();

  const map = new google.maps.Map(container, {
    center: { lat: 0, lng: 0 },
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });

  const markers = new Map<string, google.maps.Marker>();
  const sizes = new Map<string, number>();
  let hotelMarker: google.maps.Marker | null = null;
  let selectedId: string | null = null;

  const resizeObserver = new ResizeObserver(() => {
    google.maps.event.trigger(map, 'resize');
  });
  resizeObserver.observe(container);

  function icon(svg: string, size: number): google.maps.Icon {
    return {
      url: svgDataUri(svg),
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size / 2, size / 2),
    };
  }

  return {
    renderHotel(trip, lang) {
      if (!trip) return;
      map.setCenter({ lat: trip.hotel.lat, lng: trip.hotel.lng });
      hotelMarker?.setMap(null);
      hotelMarker = new google.maps.Marker({
        map,
        position: { lat: trip.hotel.lat, lng: trip.hotel.lng },
        icon: icon(hotelMarkerSvg(), HOTEL_MARKER_SIZE),
        title: t(trip.hotel.name, lang),
        zIndex: 1000,
      });
    },

    renderRestaurants(ranked, lang) {
      const maxPos = ranked.length;
      const seen = new Set<string>();

      ranked.forEach((r) => {
        seen.add(r.id);
        const size = sizeForPosition(r.position, maxPos);
        sizes.set(r.id, size);
        const color = selectedId === r.id ? MARKER_ACCENT_SELECTED : MARKER_ACCENT;

        let marker = markers.get(r.id);
        if (!marker) {
          marker = new google.maps.Marker({
            map,
            position: { lat: r.lat, lng: r.lng },
            icon: icon(restaurantMarkerSvg(size, color), size),
            title: t(r.name, lang),
          });
          marker.addListener('click', () => onMarkerClick(r.id));
          markers.set(r.id, marker);
        } else {
          marker.setIcon(icon(restaurantMarkerSvg(size, color), size));
          marker.setTitle(t(r.name, lang));
        }
      });

      for (const [id, marker] of markers) {
        if (!seen.has(id)) {
          marker.setMap(null);
          markers.delete(id);
          sizes.delete(id);
        }
      }
    },

    setSelected(id) {
      selectedId = id;
      for (const [markerId, marker] of markers) {
        const size = sizes.get(markerId) ?? MARKER_MIN_SIZE;
        const color = markerId === id ? MARKER_ACCENT_SELECTED : MARKER_ACCENT;
        marker.setIcon(icon(restaurantMarkerSvg(size, color), size));
      }
      if (id) {
        const marker = markers.get(id);
        const position = marker?.getPosition();
        if (position) map.panTo(position);
      }
    },

    invalidateSize() {
      google.maps.event.trigger(map, 'resize');
    },

    destroy() {
      resizeObserver.disconnect();
      hotelMarker?.setMap(null);
      for (const marker of markers.values()) marker.setMap(null);
      markers.clear();
    },
  };
}

/** Google Maps first, falling back to Leaflet/OSM if it can't load. */
export async function mountMapProvider(
  options: MapProviderOptions,
): Promise<{ handle: MapProviderHandle; provider: 'google' | 'osm' }> {
  try {
    return { handle: await mountGoogleProvider(options), provider: 'google' };
  } catch {
    return { handle: mountLeafletProvider(options), provider: 'osm' };
  }
}
