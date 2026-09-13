<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { trip, rankedRestaurants, selectedId } from '../stores';

  const ACCENT = '#39ff88';
  const ACCENT_SELECTED = '#4fd8ff';
  const MIN_RADIUS = 8;
  const MAX_RADIUS = 22;

  let container: HTMLDivElement;
  let map: L.Map;
  let markers = new Map<string, L.CircleMarker>();
  let hotelMarker: L.Marker | null = null;
  let unsubscribers: Array<() => void> = [];
  let resizeObserver: ResizeObserver | null = null;

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

    const unsubTrip = trip.subscribe(($trip) => {
      if (!$trip) return;
      map.setView([$trip.hotel.lat, $trip.hotel.lng], 14);
      if (hotelMarker) map.removeLayer(hotelMarker);
      hotelMarker = L.marker([$trip.hotel.lat, $trip.hotel.lng])
        .addTo(map)
        .bindPopup(`<strong>${$trip.hotel.name}</strong>`);
    });

    const unsubRanked = rankedRestaurants.subscribe(($ranked) => {
      const maxPos = $ranked.length;
      const seen = new Set<string>();
      $ranked.forEach((r) => {
        seen.add(r.id);
        const radius =
          maxPos <= 1
            ? MAX_RADIUS
            : MAX_RADIUS - ((r.position - 1) / (maxPos - 1)) * (MAX_RADIUS - MIN_RADIUS);
        let marker = markers.get(r.id);
        if (!marker) {
          marker = L.circleMarker([r.lat, r.lng], {
            radius,
            color: ACCENT,
            weight: 2,
            fillOpacity: 0.5,
          }).addTo(map);
          marker.bindTooltip(r.name);
          marker.on('click', () => selectedId.set(r.id));
          markers.set(r.id, marker);
        } else {
          marker.setRadius(radius);
        }
      });
      for (const [id, marker] of markers) {
        if (!seen.has(id)) {
          map.removeLayer(marker);
          markers.delete(id);
        }
      }
    });

    const unsubSelected = selectedId.subscribe(($id) => {
      for (const [id, marker] of markers) {
        marker.setStyle({ color: id === $id ? ACCENT_SELECTED : ACCENT });
      }
    });

    unsubscribers = [unsubTrip, unsubRanked, unsubSelected];
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
</style>
