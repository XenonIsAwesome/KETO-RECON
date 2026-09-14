// Marker artwork shared by both map providers (Leaflet/OSM and Google
// Maps): plain SVG strings, since each provider just wants either raw
// markup (Leaflet's L.divIcon) or a data: URI (Google's Icon.url).

export const MARKER_ACCENT = '#39ff88';
export const MARKER_ACCENT_SELECTED = '#4fd8ff';
export const HOTEL_MARKER_COLOR = '#4fd8ff';

export const MARKER_MIN_SIZE = 22;
export const MARKER_MAX_SIZE = 44;
export const HOTEL_MARKER_SIZE = 40;

// Lucide "utensils-crossed" glyph — a restaurant marker reads more clearly
// on a map than a generic pin or plain circle.
const UTENSILS_CROSSED_PATHS = [
  'm16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8',
  'M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7',
  'm2.1 21.8 6.4-6.3',
  'm19 5-7 7',
];

// Lucide "bed" glyph — the hotel marker so it reads as "where you're
// staying" rather than another generic map pin.
const BED_PATHS = ['M2 4v16', 'M2 8h18a2 2 0 0 1 2 2v10', 'M2 17h20', 'M6 8v9'];

function svg(paths: string[], size: number, color: string): string {
  const body = paths.map((d) => `<path d="${d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export function restaurantMarkerSvg(size: number, color: string): string {
  return svg(UTENSILS_CROSSED_PATHS, size, color);
}

export function hotelMarkerSvg(size: number = HOTEL_MARKER_SIZE, color: string = HOTEL_MARKER_COLOR): string {
  return svg(BED_PATHS, size, color);
}

/** A marker icon as a `data:` URI, for providers (Google Maps) that want a URL rather than inline markup. */
export function svgDataUri(markup: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}
