<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { trip, rankedRestaurants, selectedId } from '../stores';
  import { isDesktop } from '../breakpoint';
  import { navigateToRestaurant } from '../router';
  import { language, t, type Language } from '../language';
  import type { RankedRestaurant } from '../ranking';
  import type { Trip } from '../types';

  const ACCENT = '#39ff88';
  const ACCENT_SELECTED = '#4fd8ff';
  const MIN_SIZE = 22;
  const MAX_SIZE = 44;

  // Lucide "flame" glyph, filled solid so it reads clearly at small marker sizes.
  const FLAME_PATH =
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';

  function makeIcon(size: number, color: string): L.DivIcon {
    return L.divIcon({
      className: 'restaurant-marker',
      html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="${FLAME_PATH}" fill="${color}" /></svg>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  let container: HTMLDivElement;
  let map: L.Map;
  let markers = new Map<string, L.Marker>();
  let sizes = new Map<string, number>();
  let hotelMarker: L.Marker | null = null;
  let unsubscribers: Array<() => void> = [];
  let resizeObserver: ResizeObserver | null = null;

  function renderHotelMarker($trip: Trip | null, lang: Language) {
    if (!$trip || !map) return;
    map.setView([$trip.hotel.lat, $trip.hotel.lng], 14);
    if (hotelMarker) map.removeLayer(hotelMarker);
    hotelMarker = L.marker([$trip.hotel.lat, $trip.hotel.lng])
      .addTo(map)
      .bindPopup(`<strong>${t($trip.hotel.name, lang)}</strong>`);
  }

  function renderMarkers($ranked: RankedRestaurant[], lang: Language) {
    if (!map) return;
    const maxPos = $ranked.length;
    const seen = new Set<string>();
    const currentSelected = get(selectedId);

    $ranked.forEach((r) => {
      seen.add(r.id);
      const size =
        maxPos <= 1
          ? MAX_SIZE
          : MAX_SIZE - ((r.position - 1) / (maxPos - 1)) * (MAX_SIZE - MIN_SIZE);
      sizes.set(r.id, size);
      const color = currentSelected === r.id ? ACCENT_SELECTED : ACCENT;

      let marker = markers.get(r.id);
      if (!marker) {
        marker = L.marker([r.lat, r.lng], { icon: makeIcon(size, color) }).addTo(map);
        marker.on('click', () => {
          selectedId.set(r.id);
          // On mobile there's no list panel visible alongside the map, so
          // jump straight to the restaurant's detail page; on desktop the
          // list card is already on screen, so just highlight/pan to it.
          if (!get(isDesktop)) navigateToRestaurant(r.id);
        });
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
  }

  onMount(() => {
    map = L.map(container);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // The map panel can be toggled from display:none on mobile (map/list
    // switch) or resized on breakpoint changes; Leaflet only measures its
    // container once, so tell it to re-measure whenever that size changes.
    resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    const unsubTrip = trip.subscribe(($trip) => renderHotelMarker($trip, get(language)));
    const unsubRanked = rankedRestaurants.subscribe(($ranked) =>
      renderMarkers($ranked, get(language)),
    );
    const unsubLanguage = language.subscribe((lang) => {
      renderHotelMarker(get(trip), lang);
      renderMarkers(get(rankedRestaurants), lang);
    });

    const unsubSelected = selectedId.subscribe(($id) => {
      for (const [id, marker] of markers) {
        const size = sizes.get(id) ?? MIN_SIZE;
        marker.setIcon(makeIcon(size, id === $id ? ACCENT_SELECTED : ACCENT));
      }
      // Clicking a restaurant card in the list (or a marker on the map)
      // both funnel through selectedId, so either interaction pans the
      // map to focus that restaurant's icon.
      if ($id) {
        const marker = markers.get($id);
        if (marker) map.panTo(marker.getLatLng());
      }
    });

    unsubscribers = [unsubTrip, unsubRanked, unsubLanguage, unsubSelected];
  });

  onDestroy(() => {
    unsubscribers.forEach((u) => u());
    resizeObserver?.disconnect();
    map?.remove();
  });
</script>

<div class="map" bind:this={container}></div>

<style>
  .map {
    width: 100%;
    height: 100%;
    min-height: 260px;
  }
  :global(.restaurant-marker) {
    background: transparent;
    border: none;
    filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.6));
  }
</style>
