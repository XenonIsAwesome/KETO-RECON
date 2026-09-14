# Keto Recon

A field guide for finding keto-friendly restaurants near your hotel on a
trip — ranked by a slider you control between "closest" and "best keto
fit," with bilingual (English/Hebrew) content, Hebrew and English menu
links where they exist, a map, and offline support as an installable PWA.

Live app: deployed to GitHub Pages on every push to `main` (see
[Deployment](#deployment)).

## What it does

- **Pick a trip.** Each trip is a hotel + a curated list of nearby
  restaurants (`public/data/<slug>.json`). If there's only one trip, it
  loads automatically; with more than one, you get a picker.
- **Rank restaurants with a slider.** Drag between "CLOSER" and "KETO
  FIT" to re-sort the list by a blend of distance from the hotel and each
  restaurant's authored `keto_score` (0–10) — see
  `src/lib/ranking.ts`.
- **Browse on a map or a list**, side by side on desktop, toggled on
  mobile. The map is Leaflet + OpenStreetMap, with a Street/Satellite
  layer switch (satellite via Esri World Imagery — see
  [Maps & distances](#maps--distances)).
- **Tap into a restaurant** for its photo, keto-fit description, rating,
  distance, day/night taxi fare estimate, and links to its website and
  menu — in whichever of Hebrew/English actually exist for that
  restaurant.
- **Switch language** (🇺🇸/🇮🇱) any time — restaurant names, descriptions,
  and all UI text flip between English and Hebrew (with RTL text
  direction where needed).
- **Works offline** after the first load: it's an installable PWA that
  precaches the app shell and caches trip data and map tiles it's seen.

## Getting started

Requires Node (see `.nvmrc` for the version this project targets).

```sh
npm install
npm run dev       # start the dev server
npm run check     # type-check (svelte-check + tsc)
npm test          # run the test suite (vitest)
npm run build     # production build to dist/
npm run preview   # serve the production build locally
```

No API key or `.env` is required to run the app — see below.

## Maps & distances

These are two independent pieces using two different providers — don't
assume changing one means changing the other (see `AGENTS.md` §4 for the
full reasoning if you're an agent working on this repo).

- **The map** is Leaflet + OpenStreetMap (`src/lib/components/MapView.svelte`),
  with a Street/Satellite layer toggle. OSM itself has no aerial imagery
  of its own, so the satellite layer is Esri World Imagery — free, no API
  key, the standard pairing for this.
- **Distance calculation** (`distance_km`, used both for ranking and the
  distance shown on each restaurant) is separately upgraded at runtime
  using the Google Maps JavaScript API's Distance Matrix service — real
  driving distance from the hotel, matching how the taxi-fare fields are
  framed (`src/lib/distance.ts`, `src/lib/googleMaps.ts`). Each trip
  shows its static, OSM/haversine-derived `distance_km` immediately, then
  quietly upgrades to Google's number per restaurant once it resolves.

The static `distance_km` in the trip JSON is the **permanent fallback**,
not a placeholder — it's what's used, with no error shown, whenever
Google Maps can't be used: no API key configured, a network failure, a
quota error, or a specific route Google can't resolve. This is the
default, fully-supported state; the app is never broken by a missing key.

To enable the Google-powered distance recalculation, copy `.env.example`
to `.env` and set `VITE_GOOGLE_MAPS_API_KEY` to a key with the Distance
Matrix API enabled, restricted by HTTP referrer in Google Cloud Console.
If something's misconfigured (bad key, API not enabled, quota), the
browser console logs a `[keto-recon]`-prefixed warning explaining why it
fell back — check there first when distances aren't updating.

## Project structure

```
public/data/index.json     Manifest of trips: [{ slug, location_name }]
public/data/<slug>.json    One trip: hotel + restaurant list (see AGENTS.md for the schema)
src/App.svelte             Top-level routing: location picker / trip view / restaurant detail
src/lib/
  types.ts                 Trip/Restaurant/Hotel/ManifestEntry types
  dataLoader.ts             Fetches manifest + trip JSON
  ranking.ts                The distance/keto-score blend behind the slider
  distance.ts, googleMaps.ts  Google Distance Matrix recalculation + fallback
  mapIcons.ts               Marker SVGs shared by the map
  language.ts               EN/HE language store + UI string table
  currency.ts               ISO currency code → symbol
  router.ts                 Minimal hash-based router (trip view / restaurant detail)
  stores.ts                 Shared Svelte stores (trip, ranking, selection, slider)
  components/               Svelte components (map, list, cards, top bar, etc.)
```

Adding a new trip, researching restaurant data, and the keto-score rubric
are all documented in **`AGENTS.md`** (symlinked as `CLAUDE.md`) — written
so an agent (or a person) can add a full trip end-to-end from just a
location name.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs
`npm ci && npm run build` and publishes `dist/` to GitHub Pages. No
manual deploy step is needed once the repo's **Settings → Pages → Build
and deployment → Source** is set to "GitHub Actions" (a one-time setup
step, not something the workflow itself can set).

The current workflow doesn't set `VITE_GOOGLE_MAPS_API_KEY`, so the
deployed site runs on the OSM distance fallback (which is a fully
supported, intentional state — see above). To enable Google-powered
distances on the deployed site, add a repository secret named
`VITE_GOOGLE_MAPS_API_KEY` and pass it into the `npm run build` step in
`.github/workflows/deploy.yml` as an env var — Vite bakes `VITE_*` env
vars in at build time, not runtime, so it has to be present during that
build step specifically, not just set somewhere on the server.

## Tech stack

Svelte 5 (runes) + TypeScript + Vite, Leaflet for the map, the Google
Maps JavaScript API for distance recalculation, `vite-plugin-pwa` for
offline support, and Vitest for tests. No backend — trip data is static
JSON served from `public/data/`, and the whole app is a static site.
