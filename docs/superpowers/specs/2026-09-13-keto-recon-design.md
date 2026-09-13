# Keto Recon — Design Spec

Date: 2026-09-13

## 1. Purpose

A static, mobile-first web app that helps the user pick a keto-friendly
restaurant near their hotel while traveling. For a given trip (hotel
location), it lists nearby restaurants ranked by a slider-weighted
combination of distance and a pre-computed "keto score", shown on a map
and in a ranked list, styled as a dark spy/HUD tool. Data is authored
offline by an LLM per trip and checked in as static JSON — the app
itself does no live data collection or computation beyond ranking.

Full functional spec (data model, keto score rules, views, visual
design) was provided by the user in the original request and is
treated as normative; this document records the technical decisions
made to satisfy it and is the input to the implementation plan.

## 2. Stack

- **Vite + Svelte + TypeScript.** `npm run build` produces static
  files in `dist/`. No SSR, no backend.
- **Leaflet.js + OpenStreetMap tiles** for the map (no API key).
- **Lucide** icon set (thin-line, actively maintained, superset of
  Feather), used as inline SVG components.
- **Hash-based routing** (`#/`, `#/r/<slug>`) via a small hand-rolled
  router — only two route shapes are needed, no router library
  required, and hash routes need zero GitLab Pages rewrite config.
- No CSS framework; hand-written CSS with custom properties for the
  HUD theme, using the mandated serif font stack for headings/body and
  a monospace stack for data readouts (scores, distances, fares).

## 3. Data layer

- `public/data/index.json` — manifest: array of
  `{ "slug": "eilat", "location_name": "Dan Hotel Eilat" }`. The
  location picker is built from this at load time; if it has exactly
  one entry, that trip loads directly with no picker shown.
- `public/data/<slug>.json` — one file per trip, matching the schema
  in the user's spec section 3 verbatim (hotel + restaurants array).
- Files are fetched at runtime with `fetch()` (relative path, works
  under any GitLab Pages base path) — no bundling of trip data into
  JS, so adding a trip never requires a rebuild step beyond running
  `npm run build` again in CI.
- TypeScript interfaces in `src/lib/types.ts` mirror the schema
  exactly (`Trip`, `Hotel`, `Restaurant`).

## 4. Ranking

- `src/lib/ranking.ts` exports a pure function
  `rankRestaurants(restaurants: Restaurant[], weight: number): RankedRestaurant[]`.
- Normalization is **min-max over the currently loaded trip's
  restaurant set**: `proximityNorm = 1 - (d - dMin) / (dMax - dMin)`,
  `ketoNorm = (k - kMin) / (kMax - kMin)` (guarding the degenerate
  all-equal case by returning a constant 0.5 to avoid divide-by-zero).
- Combined score: `rank = weight * ketoNorm + (1 - weight) * proximityNorm`.
- Output is sorted descending by `rank`, each item annotated with its
  1-based position for display and for map marker sizing.
- A single Svelte derived store (`rankedRestaurants`) computes this
  from `(restaurants, sliderWeight)`, consumed by both the list and
  the map — one recompute path, no drift between the two views.
- Marker radius is a linear/sqrt scale from rank position (or
  normalized rank score) into a fixed min/max pixel range, so the
  top-ranked restaurant's icon is visibly the largest.

## 5. Views & routing

- `#/` — trip view: top bar (trip/hotel info + location picker if >1
  trip + slider), map panel, rankings list panel.
  - Desktop (≥ some breakpoint, e.g. 768px): map and list side by
    side, full-detail cards in the list.
  - Mobile: map and list stacked/toggled via a hamburger-triggered
    panel switch (map view / list view), compact rows in the list
    (rank + name only).
- `#/r/<slug>` — mobile restaurant detail route: full detail
  (photo, name→website link, menu button if `menu_url_he` present,
  rating, keto score badge, distance + day/night fares, description),
  with a back control that returns to `#/` preserving prior scroll/slider
  state (state lives in stores, not destroyed on navigation).
  - On desktop this route is not needed for normal use (cards already
    show full detail inline) but resolves to the same detail component
    full-page as a harmless fallback if visited directly.
- Clicking a map marker scrolls the corresponding list card into view
  and highlights it (shared `selectedId` store read by both map and
  list).

## 6. Visual design

- Dark HUD theme: near-black background, monospace numeric readouts,
  glowing thin-line accent color (e.g. phosphor green or cyan) for
  active/selected states, subtle scanline/radar texture as a
  background layer (CSS-only, low-opacity, not distracting).
- Font stacks exactly as specified by the user (serif for
  headings/body/descriptions, monospace for scores/distances/fares).
- Keto score shown as a distinct badge/gauge (e.g. a small radial or
  bar meter, 0–10 scale) rather than plain text, per spec.
- Responsive, legible under real one-handed phone use — no reliance on
  hover states, adequate tap targets (≥44px).

## 7. Data collection (first trip: Dan Hotel Eilat)

- Real restaurants within a 15-minute drive of Dan Hotel Eilat,
  researched via web search (not fabricated placeholders): name,
  website, coordinates, Google rating, image URL (externally hosted),
  Hebrew menu URL if found, description + keto score authored per the
  methodology in the user's spec section 4, and estimated day/night
  taxi fares for the distance (Eilat taxi rate conventions, ILS).
- This dataset and the methodology are documented in `AGENTS.md` so
  future trips can be added by an agent with no further instructions
  beyond the new location name.

## 8. Deployment

- `.gitlab-ci.yml` with a standard `pages` job: `npm ci`, `npm run
  build`, publish `dist/` as the `public/` artifact path GitLab Pages
  expects, triggered on push to `main`.

## 9. Out of scope / explicitly deferred

- No live geocoding, live ratings, or live routing/taxi-fare
  computation — all authored per-trip at data-collection time.
- No user accounts, no backend, no analytics.
- No automated tests beyond basic ranking-function unit tests (pure
  function, cheap to test; UI is manually verified in the browser).

## 10. Git workflow note

Per the user's instruction: this initial build lands directly on
`main`. `AGENTS.md` will state that all *future* changes (new trips,
tweaks) must go through feature branches + merge requests.
