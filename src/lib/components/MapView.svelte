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

  // Lucide "utensils-crossed" glyph — a restaurant marker reads more
  // clearly on a map than a generic pin or plain circle.
  const UTENSILS_CROSSED_PATHS = [
    'm16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8',
    'M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7',
    'm2.1 21.8 6.4-6.3',
    'm19 5-7 7',
  ];

  function makeIcon(size: number, color: string): L.DivIcon {
    const paths = UTENSILS_CROSSED_PATHS.map((d) => `<path d="${d}"/>`).join('');
    return L.divIcon({
      className: 'restaurant-marker',
      html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  // Lucide "hotel" glyph — the hotel marker so it reads as "where you're
  // staying" rather than another generic map pin.
  const HOTEL_COLOR = '#4fd8ff';
  const HOTEL_SIZE = 40;
  const HOTEL_PATHS = [
    'M10 22v-6.57',
    'M12 11h.01',
    'M12 7h.01',
    'M14 15.43V22',
    'M15 16a5 5 0 0 0-6 0',
    'M16 11h.01',
    'M16 7h.01',
    'M8 11h.01',
    'M8 7h.01',
  ];

  function makeHotelIcon(): L.DivIcon {
    const paths = HOTEL_PATHS.map((d) => `<path d="${d}"/>`).join('');
    return L.divIcon({
      className: 'hotel-marker',
      html: `<svg viewBox="0 0 24 24" width="${HOTEL_SIZE}" height="${HOTEL_SIZE}" fill="none" stroke="${HOTEL_COLOR}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/>${paths}</svg>`,
      iconSize: [HOTEL_SIZE, HOTEL_SIZE],
      iconAnchor: [HOTEL_SIZE / 2, HOTEL_SIZE / 2],
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
    hotelMarker = L.marker([$trip.hotel.lat, $trip.hotel.lng], { icon: makeHotelIcon() })
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
  :global(.restaurant-marker),
  :global(.hotel-marker) {
    background: transparent;
    border: none;
    filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.6));
  }
</style>
