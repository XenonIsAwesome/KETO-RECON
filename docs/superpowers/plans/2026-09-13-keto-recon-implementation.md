# Keto Recon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, mobile-first "Keto Recon" web app (Vite + Svelte + TS) that ranks nearby restaurants by a distance/keto-score slider, shown on a Leaflet map and in a rankings list, in a dark spy/HUD visual style, deployable to GitLab Pages, with a real first dataset for Dan Hotel Eilat.

**Architecture:** A single-page app with no backend. Trip data is fetched at runtime from static JSON under `public/data/`. Two Svelte stores (`trip`, `sliderWeight`) drive a derived `rankedRestaurants` store consumed identically by the map and the rankings list, so both stay in sync. A tiny hand-rolled hash router switches between the trip view and a mobile restaurant-detail view. Deployment is a standard GitLab Pages `pages` CI job.

**Tech Stack:** Vite, Svelte 5 (runes + classic `svelte/store`), TypeScript, Leaflet.js + OpenStreetMap tiles, `lucide-svelte` icons, Vitest (ranking module only).

**Spec:** [docs/superpowers/specs/2026-09-13-keto-recon-design.md](../specs/2026-09-13-keto-recon-design.md)

## Global Constraints

- Final output is a fully static site — no backend, no server-side code (spec §Purpose, §2).
- Map must use Leaflet.js + OpenStreetMap tiles, no API key (spec §2).
- Icons: Lucide, thin-line, consistent set, no mismatched styles (spec §2, §6).
- Mobile-first responsive; must be usable one-handed on a phone (spec §2, §6).
- Heading/body/description font stack (exact, copy verbatim into `theme.css`):
  `"anthropic-serif", "Anthropic Serif Fallback Georgia", "Anthropic Serif Fallback Times", "Anthropic Serif Fallback DejaVu", "Anthropic Serif Fallback Noto", Georgia, "Arial Hebrew", "Noto Sans Hebrew", "Times New Roman", Times, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "PingFang TC", "Microsoft JhengHei", "Noto Sans CJK TC", "Hiragino Sans", "Yu Gothic", Meiryo, "Noto Sans CJK JP", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", serif`
- Data readouts (scores, distances, fares) use a monospace font stack, everything else uses the stack above (spec §6).
- No automated tests beyond the ranking module's unit tests — every other unit is verified manually via the dev server (spec §9). Do not add a testing library beyond Vitest.
- Git workflow: this initial build lands directly on `main` (spec §10); do not create feature branches for this plan's tasks.
- All commit messages end with the attribution line the user's environment specifies.
- **Node/npm must come from `nvm`, never the system Node.** Before any `node`/`npm`/`npx` command in any task, run `source "$HOME/.nvm/nvm.sh" && nvm use` (the repo's `.nvmrc`, created in Task 1, pins the version). Every dependency install in this plan is a plain `npm install` / `npm ci` inside this project directory (writes only to this repo's `node_modules`) — **never** run `npm install -g`, `nvm install` a version not already present, or anything else that touches the user's global system, without explicit user permission first.
- **Commit any newly created or edited planning document (this plan file, the ledger, task briefs) to git immediately**, before running any command that scaffolds into or otherwise clears the working directory — uncommitted files in this repo are not safe from directory-wiping commands (e.g. `--overwrite` scaffolding flags).

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.ts`, `src/App.svelte`, `.gitignore`, `.nvmrc`
- Modify: none (fresh repo)

**Interfaces:**
- Produces: a working Vite+Svelte+TS project skeleton; `npm run dev`, `npm run build`, `npm run test` scripts; dependencies `leaflet`, `lucide-svelte` and devDependencies `@sveltejs/vite-plugin-svelte`, `svelte`, `vite`, `typescript`, `vitest`, `@types/leaflet` available to every later task; `.nvmrc` pinning the Node version every later task's shell must `nvm use` before running any `node`/`npm`/`npx` command.

- [ ] **Step 1: Pin the Node version via nvm (do not install Node globally or system-wide)**

Create `.nvmrc` at the repo root containing exactly:
```
20
```
Then run, in every shell used for this and all later tasks:
```bash
source "$HOME/.nvm/nvm.sh" && nvm use
```
Expected: switches to an already-installed Node 20.x (this machine already has `v20.20.0` installed via nvm — confirm with `node -v`). If no Node 20.x is installed under nvm at all, STOP and ask the user before running `nvm install 20` — do not install a new Node version without their permission.

- [ ] **Step 2: Scaffold with the official Vite Svelte-TS template**

Run:
```bash
source "$HOME/.nvm/nvm.sh" && nvm use
npm create vite@latest . -- --template svelte-ts
```
This directory is not empty (it has `.git/`, `docs/`, `.nvmrc`, and possibly `.superpowers/`). If the scaffold tool prompts about the directory not being empty, choose the option that **keeps/ignores existing files and continues** — never a "remove existing files" or `--overwrite` option/flag; those wipe everything in the directory, including uncommitted files that are not recoverable from git. If you must run it non-interactively and the only flag available is destructive, STOP and report BLOCKED instead of using it — the controller will provide a safe alternative (e.g. scaffolding in a temp directory and copying files in, or an equivalent non-destructive template command).

- [ ] **Step 3: Install runtime and dev dependencies (project-local only — never `-g`)**

Run:
```bash
source "$HOME/.nvm/nvm.sh" && nvm use
npm install leaflet lucide-svelte
npm install -D @types/leaflet vitest
```

- [ ] **Step 4: Confirm the Svelte version scaffolded is Svelte 5**

Run: `npm ls svelte`
Expected: a `5.x.x` version. If the template scaffolded Svelte 4 instead, run `npm install svelte@^5` and re-run `npm install` — every component in this plan uses Svelte 5 runes (`$props`, `$state`, `$derived`) and `onclick`-style event attributes.

- [ ] **Step 5: Replace `vite.config.ts` with the project config (adds `base: './'` for GitLab Pages subpaths, and Vitest config for the ranking module)**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: Add a `test` script to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run"
```

- [ ] **Step 7: Replace the scaffolded `src/App.svelte` with a placeholder (later tasks build the real one)**

```svelte
<script lang="ts">
</script>

<main>
  <h1>Keto Recon — scaffolding OK</h1>
</main>
```

- [ ] **Step 8: Verify dev server and build both work**

Run: `npm run build`
Expected: exits 0, creates `dist/index.html` and `dist/assets/*`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Scaffold Vite + Svelte 5 + TypeScript project

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Data types and the trip data loader

**Files:**
- Create: `src/lib/types.ts`, `src/lib/dataLoader.ts`
- Test: verified by type-check only (per spec §9, no test file for this task); exercised end-to-end in Task 14.

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `Hotel`, `Restaurant`, `Trip`, `ManifestEntry` types; `loadManifest(): Promise<ManifestEntry[]>`; `loadTrip(slug: string): Promise<Trip>`. Every later task that touches trip data imports these from `src/lib/types.ts` and `src/lib/dataLoader.ts`.

- [ ] **Step 1: Write `src/lib/types.ts`**

```ts
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
```

- [ ] **Step 2: Write `src/lib/dataLoader.ts`**

```ts
import type { Trip, ManifestEntry } from './types';

export async function loadManifest(): Promise<ManifestEntry[]> {
  const res = await fetch('data/index.json');
  if (!res.ok) {
    throw new Error(`Failed to load manifest: HTTP ${res.status}`);
  }
  return res.json();
}

export async function loadTrip(slug: string): Promise<Trip> {
  const res = await fetch(`data/${slug}.json`);
  if (!res.ok) {
    throw new Error(`Failed to load trip data for "${slug}": HTTP ${res.status}`);
  }
  return res.json();
}
```

Note: paths are relative (no leading `/`) so they resolve correctly under any GitLab Pages project subpath, matching `base: './'` in `vite.config.ts`.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `types.ts` or `dataLoader.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/dataLoader.ts
git commit -m "Add trip data types and static data loader

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Ranking module (TDD)

**Files:**
- Create: `src/lib/ranking.ts`, `src/lib/ranking.test.ts`

**Interfaces:**
- Consumes: `Restaurant` from `src/lib/types.ts`.
- Produces: `RankedRestaurant` type (a `Restaurant` plus `rank: number` and `position: number`) and `rankRestaurants(restaurants: Restaurant[], weight: number): RankedRestaurant[]`. Consumed by `src/lib/stores.ts` (Task 5), `RestaurantDetail.svelte` (Task 13), and `MapView.svelte` (Task 11).

- [ ] **Step 1: Write the failing tests in `src/lib/ranking.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { rankRestaurants } from './ranking';
import type { Restaurant } from './types';

function makeRestaurant(overrides: Partial<Restaurant>): Restaurant {
  return {
    id: 'r',
    name: 'R',
    website_url: 'https://example.com',
    menu_url_he: null,
    image_url: 'https://example.com/img.jpg',
    lat: 0,
    lng: 0,
    google_rating: 4.0,
    keto_score: 5,
    description: 'desc',
    distance_km: 1,
    taxi_fare_day: 10,
    taxi_fare_night: 12,
    currency: 'ILS',
    ...overrides,
  };
}

describe('rankRestaurants', () => {
  it('returns an empty array for no restaurants', () => {
    expect(rankRestaurants([], 0.5)).toEqual([]);
  });

  it('assigns position 1 to a single restaurant regardless of weight', () => {
    const result = rankRestaurants([makeRestaurant({ id: 'only' })], 0.3);
    expect(result).toHaveLength(1);
    expect(result[0].position).toBe(1);
  });

  it('at weight=0, orders purely by ascending distance', () => {
    const near = makeRestaurant({ id: 'near', distance_km: 1, keto_score: 1 });
    const far = makeRestaurant({ id: 'far', distance_km: 5, keto_score: 9 });
    const result = rankRestaurants([far, near], 0);
    expect(result.map((r) => r.id)).toEqual(['near', 'far']);
  });

  it('at weight=1, orders purely by descending keto_score', () => {
    const lowKeto = makeRestaurant({ id: 'low', distance_km: 1, keto_score: 1 });
    const highKeto = makeRestaurant({ id: 'high', distance_km: 5, keto_score: 9 });
    const result = rankRestaurants([lowKeto, highKeto], 1);
    expect(result.map((r) => r.id)).toEqual(['high', 'low']);
  });

  it('at weight=0.5, blends distance and keto score', () => {
    // 'balanced' is closer but 'ketoWinner' has a much better score;
    // with an even blend the keto advantage should win here.
    const balanced = makeRestaurant({ id: 'balanced', distance_km: 1, keto_score: 1 });
    const ketoWinner = makeRestaurant({ id: 'ketoWinner', distance_km: 2, keto_score: 10 });
    const result = rankRestaurants([balanced, ketoWinner], 0.5);
    expect(result[0].id).toBe('ketoWinner');
  });

  it('clamps out-of-range weights into [0, 1]', () => {
    const near = makeRestaurant({ id: 'near', distance_km: 1, keto_score: 1 });
    const far = makeRestaurant({ id: 'far', distance_km: 5, keto_score: 9 });
    const result = rankRestaurants([far, near], -3);
    expect(result.map((r) => r.id)).toEqual(['near', 'far']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/ranking.test.ts`
Expected: FAIL — `ranking.ts` does not exist yet.

- [ ] **Step 3: Write `src/lib/ranking.ts`**

```ts
import type { Restaurant } from './types';

export interface RankedRestaurant extends Restaurant {
  rank: number;
  position: number;
}

export function rankRestaurants(
  restaurants: Restaurant[],
  weight: number,
): RankedRestaurant[] {
  if (restaurants.length === 0) return [];

  const w = Math.min(1, Math.max(0, weight));

  const distances = restaurants.map((r) => r.distance_km);
  const scores = restaurants.map((r) => r.keto_score);

  const dMin = Math.min(...distances);
  const dMax = Math.max(...distances);
  const kMin = Math.min(...scores);
  const kMax = Math.max(...scores);

  const dSpread = dMax - dMin;
  const kSpread = kMax - kMin;

  const ranked: RankedRestaurant[] = restaurants.map((r) => {
    const proximityNorm = dSpread === 0 ? 0.5 : 1 - (r.distance_km - dMin) / dSpread;
    const ketoNorm = kSpread === 0 ? 0.5 : (r.keto_score - kMin) / kSpread;
    const rank = w * ketoNorm + (1 - w) * proximityNorm;
    return { ...r, rank, position: 0 };
  });

  ranked.sort((a, b) => b.rank - a.rank);
  ranked.forEach((r, i) => {
    r.position = i + 1;
  });

  return ranked;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/ranking.test.ts`
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ranking.ts src/lib/ranking.test.ts
git commit -m "Add ranking module with unit tests

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Hash router

**Files:**
- Create: `src/lib/router.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Route` type (`{ name: 'trip' } | { name: 'restaurant'; id: string }`), `route` (a `Readable<Route>` store), `navigateToTrip(): void`, `navigateToRestaurant(id: string): void`, and the exported pure helper `parseHash(hash: string): Route` (exported for the type-check/manual verification below). Consumed by `App.svelte` (Task 14), `RestaurantRow.svelte` (Task 9), `RestaurantDetail.svelte` (Task 13).

- [ ] **Step 1: Write `src/lib/router.ts`**

```ts
import { writable } from 'svelte/store';

export type Route = { name: 'trip' } | { name: 'restaurant'; id: string };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);
  if (parts[0] === 'r' && parts[1]) {
    return { name: 'restaurant', id: decodeURIComponent(parts[1]) };
  }
  return { name: 'trip' };
}

function currentRoute(): Route {
  return parseHash(typeof location !== 'undefined' ? location.hash : '');
}

export const route = writable<Route>(currentRoute());

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route.set(currentRoute());
  });
}

export function navigateToTrip(): void {
  location.hash = '#/';
}

export function navigateToRestaurant(id: string): void {
  location.hash = `#/r/${encodeURIComponent(id)}`;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually sanity-check `parseHash` in a scratch REPL** (per spec §9, no test file for this module — full behavior is exercised in the browser in Task 14)

Run:
```bash
node -e "
const { parseHash } = require('./src/lib/router.ts');
" 2>/dev/null || echo "skip: TS requires the app context; verified instead via tsc + Task 14 browser check"
```
This step is a no-op safety note, not a real check — the actual confirmation is: (a) Step 2's clean type-check, and (b) manually visiting `#/` and `#/r/<id>` in the browser during Task 14's verification, confirming the correct view renders each time.

- [ ] **Step 4: Commit**

```bash
git add src/lib/router.ts
git commit -m "Add hash-based router

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Global stores and breakpoint detection

**Files:**
- Create: `src/lib/stores.ts`, `src/lib/breakpoint.ts`

**Interfaces:**
- Consumes: `Trip` from `types.ts`, `rankRestaurants`/`RankedRestaurant` from `ranking.ts`.
- Produces: `trip: Writable<Trip | null>`, `sliderWeight: Writable<number>` (initial `0.5`), `selectedId: Writable<string | null>`, `rankedRestaurants: Readable<RankedRestaurant[]>` from `stores.ts`; `isDesktop: Readable<boolean>` from `breakpoint.ts` (true when viewport ≥ 860px). Consumed by nearly every component task from Task 8 onward.

- [ ] **Step 1: Write `src/lib/stores.ts`**

```ts
import { writable, derived, type Readable } from 'svelte/store';
import type { Trip } from './types';
import { rankRestaurants, type RankedRestaurant } from './ranking';

export const trip = writable<Trip | null>(null);
export const sliderWeight = writable(0.5);
export const selectedId = writable<string | null>(null);

export const rankedRestaurants: Readable<RankedRestaurant[]> = derived(
  [trip, sliderWeight],
  ([$trip, $sliderWeight]) => ($trip ? rankRestaurants($trip.restaurants, $sliderWeight) : []),
);
```

- [ ] **Step 2: Write `src/lib/breakpoint.ts`**

```ts
import { writable, type Readable } from 'svelte/store';

const QUERY = '(min-width: 860px)';

function createIsDesktopStore(): Readable<boolean> {
  const mql = typeof window !== 'undefined' ? window.matchMedia(QUERY) : null;
  const { subscribe, set } = writable(mql ? mql.matches : true);
  if (mql) {
    mql.addEventListener('change', (e) => set(e.matches));
  }
  return { subscribe };
}

export const isDesktop = createIsDesktopStore();
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/stores.ts src/lib/breakpoint.ts
git commit -m "Add global stores and desktop breakpoint detection

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: HUD theme CSS

**Files:**
- Create: `src/styles/theme.css`

**Interfaces:**
- Consumes: nothing.
- Produces: global CSS custom properties (`--bg`, `--bg-panel`, `--bg-elevated`, `--accent`, `--accent-alt`, `--text`, `--text-dim`, `--border`, `--radius`, `--font-display`, `--font-mono`) and a `.mono` utility class, consumed by every component's `<style>` block from Task 7 onward. Imported once, from `src/main.ts` (Task 14).

- [ ] **Step 1: Write `src/styles/theme.css`**

```css
:root {
  --bg: #06090a;
  --bg-panel: #0d1416;
  --bg-elevated: #121b1d;
  --accent: #39ff88;
  --accent-alt: #4fd8ff;
  --text: #d7ece2;
  --text-dim: #7fa393;
  --border: #1d2b2c;
  --radius: 6px;
  --font-display: "anthropic-serif", "Anthropic Serif Fallback Georgia", "Anthropic Serif Fallback Times", "Anthropic Serif Fallback DejaVu", "Anthropic Serif Fallback Noto", Georgia, "Arial Hebrew", "Noto Sans Hebrew", "Times New Roman", Times, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "PingFang TC", "Microsoft JhengHei", "Noto Sans CJK TC", "Hiragino Sans", "Yu Gothic", Meiryo, "Noto Sans CJK JP", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", serif;
  --font-mono: "JetBrains Mono", "SF Mono", Consolas, Menlo, monospace;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-display);
}

#app {
  min-height: 100vh;
  position: relative;
}

.scanlines::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999;
  background: repeating-linear-gradient(
    to bottom,
    rgba(57, 255, 136, 0.035) 0px,
    rgba(57, 255, 136, 0.035) 1px,
    transparent 1px,
    transparent 3px
  );
}

.mono {
  font-family: var(--font-mono);
}

button {
  font-family: var(--font-display);
  cursor: pointer;
}

a {
  color: var(--accent-alt);
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}
```

- [ ] **Step 2: Commit** (imported and visually verified in Task 14, once there's a full page to look at)

```bash
git add src/styles/theme.css
git commit -m "Add HUD theme CSS

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: KetoBadge component

**Files:**
- Create: `src/lib/components/KetoBadge.svelte`

**Interfaces:**
- Consumes: theme CSS vars (`--border`, `--accent`).
- Produces: `KetoBadge` component with prop `score: number` (0–10), rendered as a ring gauge + numeric readout. Consumed by `RestaurantCard.svelte` (Task 9).

- [ ] **Step 1: Write `src/lib/components/KetoBadge.svelte`**

```svelte
<script lang="ts">
  let { score }: { score: number } = $props();

  const clamped = Math.max(0, Math.min(10, score));
  const pct = clamped / 10;
  const circumference = 2 * Math.PI * 16;
  const dash = circumference * pct;
</script>

<div class="badge mono" title="Keto fit score: {clamped.toFixed(1)} / 10">
  <svg viewBox="0 0 40 40" width="40" height="40">
    <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border)" stroke-width="4" />
    <circle
      cx="20"
      cy="20"
      r="16"
      fill="none"
      stroke="var(--accent)"
      stroke-width="4"
      stroke-dasharray="{dash} {circumference}"
      stroke-linecap="round"
      transform="rotate(-90 20 20)"
    />
  </svg>
  <span class="value">{clamped.toFixed(1)}</span>
</div>

<style>
  .badge {
    position: relative;
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .badge svg {
    position: absolute;
    inset: 0;
  }
  .value {
    position: relative;
    font-size: 0.7rem;
    color: var(--accent);
  }
</style>
```

- [ ] **Step 2: Verify it renders** — temporarily mount it in `src/App.svelte` (`<script>import KetoBadge from './lib/components/KetoBadge.svelte';</script>` + `<KetoBadge score={7.2} />`), run `npm run dev`, confirm a green ring gauge showing "7.2" appears. Revert the temporary `App.svelte` change afterward (Task 14 rewrites `App.svelte` for real).

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/KetoBadge.svelte
git commit -m "Add KetoBadge gauge component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Slider, TopBar, LocationPicker components

**Files:**
- Create: `src/lib/components/Slider.svelte`, `src/lib/components/TopBar.svelte`, `src/lib/components/LocationPicker.svelte`

**Interfaces:**
- Consumes: `sliderWeight` store (Task 5); `Trip`, `ManifestEntry` types (Task 2); `lucide-svelte`'s `Menu` icon.
- Produces: `Slider` (no props, binds directly to `sliderWeight`), `TopBar` (props: `trip: Trip`, `manifest: ManifestEntry[]`, `onChangeTrip: (slug: string) => void`, `onToggleMenu: () => void`), `LocationPicker` (props: `manifest: ManifestEntry[]`, `onSelect: (slug: string) => void`). Consumed by `TripView.svelte` (Task 12) and `App.svelte` (Task 14).

- [ ] **Step 1: Write `src/lib/components/Slider.svelte`**

```svelte
<script lang="ts">
  import { sliderWeight } from '../stores';
</script>

<div class="slider-wrap">
  <span class="label mono">CLOSER</span>
  <input
    type="range"
    min="0"
    max="1"
    step="0.01"
    value={$sliderWeight}
    oninput={(e) => sliderWeight.set(Number((e.target as HTMLInputElement).value))}
  />
  <span class="label mono">KETO FIT</span>
</div>

<style>
  .slider-wrap {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    flex: 1;
    min-width: 160px;
  }
  input[type='range'] {
    flex: 1;
    accent-color: var(--accent);
  }
  .label {
    font-size: 0.7rem;
    color: var(--text-dim);
    letter-spacing: 0.05em;
    white-space: nowrap;
  }
</style>
```

- [ ] **Step 2: Write `src/lib/components/TopBar.svelte`**

```svelte
<script lang="ts">
  import type { Trip, ManifestEntry } from '../types';
  import Slider from './Slider.svelte';
  import { Menu } from 'lucide-svelte';

  let {
    trip,
    manifest,
    onChangeTrip,
    onToggleMenu,
  }: {
    trip: Trip;
    manifest: ManifestEntry[];
    onChangeTrip: (slug: string) => void;
    onToggleMenu: () => void;
  } = $props();

  function handleTripChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    const entry = manifest.find((m) => m.location_name === value);
    if (entry) onChangeTrip(entry.slug);
  }
</script>

<header class="topbar">
  <div class="identity">
    <h1 class="mono">KETO RECON</h1>
    <p class="hotel">{trip.hotel.name} — {trip.location_name}</p>
  </div>
  <Slider />
  {#if manifest.length > 1}
    <select class="mono" value={trip.location_name} onchange={handleTripChange}>
      {#each manifest as m (m.slug)}
        <option value={m.location_name}>{m.location_name}</option>
      {/each}
    </select>
  {/if}
  <button class="hamburger" onclick={onToggleMenu} aria-label="Toggle panels">
    <Menu size={20} />
  </button>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .identity h1 {
    margin: 0;
    font-size: 1rem;
    color: var(--accent);
    letter-spacing: 0.1em;
  }
  .hotel {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-dim);
  }
  select {
    background: var(--bg-elevated);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.25rem 0.5rem;
  }
  .hamburger {
    display: none;
    background: none;
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: var(--radius);
    padding: 0.4rem 0.7rem;
  }
  @media (max-width: 860px) {
    .hamburger {
      display: inline-flex;
    }
  }
</style>
```

- [ ] **Step 3: Write `src/lib/components/LocationPicker.svelte`**

```svelte
<script lang="ts">
  import type { ManifestEntry } from '../types';

  let { manifest, onSelect }: { manifest: ManifestEntry[]; onSelect: (slug: string) => void } =
    $props();
</script>

<div class="picker">
  <h1 class="mono">KETO RECON</h1>
  <p class="subtitle mono">SELECT TARGET LOCATION</p>
  <ul>
    {#each manifest as entry (entry.slug)}
      <li>
        <button onclick={() => onSelect(entry.slug)}>{entry.location_name}</button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
  }
  h1 {
    color: var(--accent);
    letter-spacing: 0.15em;
    font-size: 1.5rem;
    margin: 0;
  }
  .subtitle {
    color: var(--text-dim);
    letter-spacing: 0.1em;
    font-size: 0.85rem;
    margin: 0;
  }
  ul {
    list-style: none;
    padding: 0;
    width: 100%;
    max-width: 360px;
  }
  li {
    margin-bottom: 0.75rem;
  }
  button {
    width: 100%;
    padding: 0.9rem 1rem;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: var(--radius);
    font-size: 1rem;
  }
  button:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (Full visual/behavioral verification happens in Task 14 once these are wired into the app.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/Slider.svelte src/lib/components/TopBar.svelte src/lib/components/LocationPicker.svelte
git commit -m "Add Slider, TopBar, LocationPicker components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: RestaurantCard and RestaurantRow components

**Files:**
- Create: `src/lib/components/RestaurantCard.svelte`, `src/lib/components/RestaurantRow.svelte`

**Interfaces:**
- Consumes: `RankedRestaurant` (Task 3), `selectedId` store (Task 5), `navigateToRestaurant` (Task 4), `KetoBadge` (Task 7), `lucide-svelte`'s `Star`, `MapPin`, `Car`, `ExternalLink`, `BookOpen` icons.
- Produces: `RestaurantCard` (props: `restaurant: RankedRestaurant`, `selected?: boolean`, default `false`) — the full-detail desktop card, reused verbatim by `RestaurantDetail.svelte` (Task 13); `RestaurantRow` (same props) — the compact mobile row. Both give their root element `id="restaurant-{restaurant.id}"` so `RankingsList` (Task 10) can scroll to them. Consumed by `RankingsList.svelte` (Task 10) and `RestaurantDetail.svelte` (Task 13).

- [ ] **Step 1: Write `src/lib/components/RestaurantCard.svelte`**

```svelte
<script lang="ts">
  import type { RankedRestaurant } from '../ranking';
  import { selectedId } from '../stores';
  import KetoBadge from './KetoBadge.svelte';
  import { Star, MapPin, Car, ExternalLink, BookOpen } from 'lucide-svelte';

  let { restaurant, selected = false }: { restaurant: RankedRestaurant; selected?: boolean } =
    $props();
</script>

<article
  class="card"
  class:selected
  id="restaurant-{restaurant.id}"
  onclick={() => selectedId.set(restaurant.id)}
>
  <img class="photo" src={restaurant.image_url} alt={restaurant.name} loading="lazy" />
  <div class="body">
    <div class="header-row">
      <span class="position mono">#{restaurant.position}</span>
      <a class="name" href={restaurant.website_url} target="_blank" rel="noopener noreferrer">
        {restaurant.name}
      </a>
      <KetoBadge score={restaurant.keto_score} />
    </div>
    <div class="meta mono">
      <span class="rating"><Star size={14} /> {restaurant.google_rating.toFixed(1)}</span>
      <span class="distance"><MapPin size={14} /> {restaurant.distance_km.toFixed(1)} km</span>
      <span class="fare">
        <Car size={14} /> day {restaurant.taxi_fare_day} / night {restaurant.taxi_fare_night}
        {restaurant.currency}
      </span>
    </div>
    <p class="description">{restaurant.description}</p>
    <div class="actions">
      <a class="link" href={restaurant.website_url} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={14} /> Website
      </a>
      {#if restaurant.menu_url_he}
        <a class="link" href={restaurant.menu_url_he} target="_blank" rel="noopener noreferrer">
          <BookOpen size={14} /> Menu
        </a>
      {/if}
    </div>
  </div>
</article>

<style>
  .card {
    display: flex;
    gap: 1rem;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    margin-bottom: 1rem;
  }
  .card.selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .photo {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: var(--radius);
    flex-shrink: 0;
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  .header-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .position {
    color: var(--accent-alt);
  }
  .name {
    font-size: 1.1rem;
    font-weight: 600;
    flex: 1;
  }
  .meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: var(--text-dim);
    margin: 0.4rem 0;
  }
  .meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  .description {
    font-size: 0.9rem;
    line-height: 1.4;
    color: var(--text);
  }
  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
  }
  @media (max-width: 860px) {
    .photo {
      width: 80px;
      height: 80px;
    }
  }
</style>
```

- [ ] **Step 2: Write `src/lib/components/RestaurantRow.svelte`**

```svelte
<script lang="ts">
  import type { RankedRestaurant } from '../ranking';
  import { selectedId } from '../stores';
  import { navigateToRestaurant } from '../router';

  let { restaurant, selected = false }: { restaurant: RankedRestaurant; selected?: boolean } =
    $props();

  function open() {
    selectedId.set(restaurant.id);
    navigateToRestaurant(restaurant.id);
  }
</script>

<button class="row mono" class:selected id="restaurant-{restaurant.id}" onclick={open}>
  <span class="position">#{restaurant.position}</span>
  <span class="name">{restaurant.name}</span>
</button>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.9rem 1rem;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-bottom: none;
    color: var(--text);
    text-align: left;
    font-size: 1rem;
  }
  .row:last-child {
    border-bottom: 1px solid var(--border);
  }
  .row.selected {
    border-color: var(--accent);
  }
  .position {
    color: var(--accent-alt);
    width: 2.5rem;
    flex-shrink: 0;
  }
  .name {
    font-family: var(--font-display);
    flex: 1;
  }
</style>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/RestaurantCard.svelte src/lib/components/RestaurantRow.svelte
git commit -m "Add RestaurantCard (desktop) and RestaurantRow (mobile) components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: RankingsList component

**Files:**
- Create: `src/lib/components/RankingsList.svelte`

**Interfaces:**
- Consumes: `rankedRestaurants`, `selectedId` (Task 5), `isDesktop` (Task 5), `RestaurantCard`/`RestaurantRow` (Task 9).
- Produces: `RankingsList` component (no props — reads its data entirely from stores), including the scroll-into-view behavior when `selectedId` changes (e.g., from a map marker click). Consumed by `TripView.svelte` (Task 12).

- [ ] **Step 1: Write `src/lib/components/RankingsList.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { rankedRestaurants, selectedId } from '../stores';
  import { isDesktop } from '../breakpoint';
  import RestaurantCard from './RestaurantCard.svelte';
  import RestaurantRow from './RestaurantRow.svelte';

  onMount(() => {
    const unsub = selectedId.subscribe((id) => {
      if (!id) return;
      document.getElementById(`restaurant-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
    return unsub;
  });
</script>

<div class="list">
  {#each $rankedRestaurants as r (r.id)}
    {#if $isDesktop}
      <RestaurantCard restaurant={r} selected={$selectedId === r.id} />
    {:else}
      <RestaurantRow restaurant={r} selected={$selectedId === r.id} />
    {/if}
  {/each}
</div>

<style>
  .list {
    padding: 1rem;
    height: 100%;
    overflow-y: auto;
  }
</style>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (Full behavior verified in Task 14.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/RankingsList.svelte
git commit -m "Add RankingsList component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 11: MapView component (Leaflet)

**Files:**
- Create: `src/lib/components/MapView.svelte`

**Interfaces:**
- Consumes: `trip`, `rankedRestaurants`, `selectedId` (Task 5); `leaflet` package.
- Produces: `MapView` component (no props), rendering the hotel marker plus one circle marker per restaurant, radius scaled by rank position, clicking a marker sets `selectedId`. Consumed by `TripView.svelte` (Task 12).

- [ ] **Step 1: Write `src/lib/components/MapView.svelte`**

```svelte
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

  onMount(() => {
    map = L.map(container);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

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
```

Note: `ACCENT`/`ACCENT_SELECTED` are hardcoded hex values because Leaflet's `color` style option cannot read CSS custom properties — keep these two constants in sync with `--accent` / `--accent-alt` in `src/styles/theme.css` if the palette ever changes.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/MapView.svelte
git commit -m "Add Leaflet MapView component with rank-scaled markers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 12: TripView component (desktop/mobile layout)

**Files:**
- Create: `src/lib/components/TripView.svelte`

**Interfaces:**
- Consumes: `trip`, `isDesktop` (Task 5), `TopBar` (Task 8), `MapView` (Task 11), `RankingsList` (Task 10).
- Produces: `TripView` component (props: `manifest: ManifestEntry[]`, `onChangeTrip: (slug: string) => void`) — the main trip screen: top bar + map/list panels, with a mobile hamburger toggle between map and list. Consumed by `App.svelte` (Task 14).

- [ ] **Step 1: Write `src/lib/components/TripView.svelte`**

```svelte
<script lang="ts">
  import { trip } from '../stores';
  import { isDesktop } from '../breakpoint';
  import type { ManifestEntry } from '../types';
  import TopBar from './TopBar.svelte';
  import MapView from './MapView.svelte';
  import RankingsList from './RankingsList.svelte';

  let { manifest, onChangeTrip }: { manifest: ManifestEntry[]; onChangeTrip: (slug: string) => void } =
    $props();

  let mobilePanel = $state<'map' | 'list'>('list');

  function toggleMobilePanel() {
    mobilePanel = mobilePanel === 'list' ? 'map' : 'list';
  }
</script>

{#if $trip}
  <div class="trip-view">
    <TopBar trip={$trip} {manifest} {onChangeTrip} onToggleMenu={toggleMobilePanel} />
    <div class="panels">
      <div class="map-panel" class:hidden-mobile={!$isDesktop && mobilePanel !== 'map'}>
        <MapView />
      </div>
      <div class="list-panel" class:hidden-mobile={!$isDesktop && mobilePanel !== 'list'}>
        <RankingsList />
      </div>
    </div>
  </div>
{/if}

<style>
  .trip-view {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  .panels {
    flex: 1;
    display: flex;
    min-height: 0;
  }
  .map-panel,
  .list-panel {
    flex: 1 1 50%;
    min-width: 0;
  }
  .list-panel {
    overflow-y: auto;
  }
  @media (max-width: 860px) {
    .panels {
      flex-direction: column;
    }
    .map-panel,
    .list-panel {
      flex: 1 1 auto;
      height: 100%;
    }
    .hidden-mobile {
      display: none;
    }
  }
</style>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/TripView.svelte
git commit -m "Add TripView layout component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 13: RestaurantDetail component

**Files:**
- Create: `src/lib/components/RestaurantDetail.svelte`

**Interfaces:**
- Consumes: `trip`, `sliderWeight` (Task 5), `rankRestaurants` (Task 3), `navigateToTrip` (Task 4), `RestaurantCard` (Task 9), `lucide-svelte`'s `ArrowLeft` icon.
- Produces: `RestaurantDetail` component (props: `id: string`) — the mobile restaurant detail route. Consumed by `App.svelte` (Task 14).

- [ ] **Step 1: Write `src/lib/components/RestaurantDetail.svelte`**

```svelte
<script lang="ts">
  import { trip, sliderWeight } from '../stores';
  import { rankRestaurants } from '../ranking';
  import { navigateToTrip } from '../router';
  import RestaurantCard from './RestaurantCard.svelte';
  import { ArrowLeft } from 'lucide-svelte';

  let { id }: { id: string } = $props();

  let restaurant = $derived(
    $trip ? (rankRestaurants($trip.restaurants, $sliderWeight).find((r) => r.id === id) ?? null) : null,
  );
</script>

<div class="detail-page">
  <button class="back mono" onclick={navigateToTrip}>
    <ArrowLeft size={16} /> BACK TO RANKINGS
  </button>
  {#if restaurant}
    <RestaurantCard {restaurant} />
  {:else}
    <p class="mono">Restaurant not found.</p>
  {/if}
</div>

<style>
  .detail-page {
    padding: 1rem;
    max-width: 640px;
    margin: 0 auto;
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: none;
    border: 1px solid var(--border);
    color: var(--accent);
    border-radius: var(--radius);
    padding: 0.5rem 0.8rem;
    margin-bottom: 1rem;
    font-size: 0.8rem;
  }
</style>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/RestaurantDetail.svelte
git commit -m "Add RestaurantDetail route component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 14: Wire the app together (App.svelte, main.ts, index.html) and verify end-to-end

**Files:**
- Modify: `src/App.svelte`, `src/main.ts`, `index.html`
- Create: `public/data/index.json` (empty-array placeholder — Task 17 fills it in), a minimal `public/data/_sample.json` is NOT created; instead this task creates a tiny throwaway fixture trip for manual verification only (see Step 1).

**Interfaces:**
- Consumes: everything from Tasks 2–13.
- Produces: a fully wired, runnable app.

- [ ] **Step 1: Create a temporary fixture trip for manual verification**

Create `public/data/index.json`:
```json
[{ "slug": "_fixture", "location_name": "Fixture Test Trip" }]
```

Create `public/data/_fixture.json`:
```json
{
  "location_name": "Fixture Test Trip",
  "hotel": { "name": "Test Hotel", "lat": 29.5577, "lng": 34.9519, "address": "Test address" },
  "restaurants": [
    {
      "id": "alpha",
      "name": "Alpha Grill",
      "website_url": "https://example.com/alpha",
      "menu_url_he": "https://example.com/alpha/menu-he",
      "image_url": "https://picsum.photos/seed/alpha/400/300",
      "lat": 29.56,
      "lng": 34.955,
      "google_rating": 4.5,
      "keto_score": 8.0,
      "description": "A varied grill menu with strong low-carb options and a full non-keto menu for companions.",
      "distance_km": 1.2,
      "taxi_fare_day": 20,
      "taxi_fare_night": 25,
      "currency": "ILS"
    },
    {
      "id": "beta",
      "name": "Beta Bistro",
      "website_url": "https://example.com/beta",
      "menu_url_he": null,
      "image_url": "https://picsum.photos/seed/beta/400/300",
      "lat": 29.565,
      "lng": 34.96,
      "google_rating": 4.1,
      "keto_score": 3.5,
      "description": "Mostly carb-heavy menu with a couple of workable low-carb salads.",
      "distance_km": 3.0,
      "taxi_fare_day": 30,
      "taxi_fare_night": 38,
      "currency": "ILS"
    }
  ]
}
```
(This fixture is replaced in Task 17 once the real Eilat manifest entry exists — `_fixture` is deleted at the end of this task's verification, see Step 6.)

- [ ] **Step 2: Replace `src/App.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { loadManifest, loadTrip } from './lib/dataLoader';
  import { trip as tripStore } from './lib/stores';
  import { route } from './lib/router';
  import type { ManifestEntry } from './lib/types';
  import LocationPicker from './lib/components/LocationPicker.svelte';
  import TripView from './lib/components/TripView.svelte';
  import RestaurantDetail from './lib/components/RestaurantDetail.svelte';

  let manifest = $state<ManifestEntry[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      manifest = await loadManifest();
      if (manifest.length === 1) {
        await selectTrip(manifest[0].slug);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  });

  async function selectTrip(slug: string) {
    loading = true;
    error = null;
    try {
      tripStore.set(await loadTrip(slug));
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }
</script>

<div id="app" class="scanlines">
  {#if loading}
    <div class="status-screen mono">LOADING RECON DATA…</div>
  {:else if error}
    <div class="status-screen mono">ERROR: {error}</div>
  {:else if !$tripStore}
    <LocationPicker {manifest} onSelect={selectTrip} />
  {:else if $route.name === 'restaurant'}
    <RestaurantDetail id={$route.id} />
  {:else}
    <TripView {manifest} onChangeTrip={selectTrip} />
  {/if}
</div>

<style>
  .status-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: var(--accent);
    letter-spacing: 0.1em;
  }
</style>
```

- [ ] **Step 3: Replace `src/main.ts`**

```ts
import { mount } from 'svelte';
import App from './App.svelte';
import './styles/theme.css';

const app = mount(App, { target: document.getElementById('app')! });

export default app;
```

- [ ] **Step 4: Confirm `index.html` has the right mount point and title**

It should already look like this after Task 1's scaffold (adjust only if it doesn't match):
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Keto Recon</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Manual end-to-end verification with the dev server**

Run: `npm run dev`, open the printed local URL in a browser.

Confirm all of the following:
1. The fixture trip loads automatically (no picker, since the manifest has one entry) and the dark HUD theme is visible (background, monospace numerics, serif body text).
2. The map is centered near the fixture hotel coordinates, with a hotel marker and two restaurant markers, "Alpha Grill"'s marker visibly larger than "Beta Bistro"'s at the default slider position.
3. Moving the slider fully to "CLOSER" re-sorts the list so the nearer restaurant (Alpha, 1.2km) is first; moving it fully to "KETO FIT" puts the higher keto_score restaurant (Alpha, 8.0) first — list order and marker sizes both update live.
4. Resize the browser below 860px width (or use device toolbar): the top bar shows a hamburger icon; only one of map/list is visible at a time; clicking the hamburger toggles between them; the list rows show only rank + name.
5. On the narrow view, tap a restaurant row: URL hash becomes `#/r/alpha` (or `beta`), a dedicated detail page renders with photo, name link, menu button (Alpha only, since Beta's `menu_url_he` is `null`), rating, keto badge, distance, day/night fares, and description. Tap "BACK TO RANKINGS": returns to the list.
6. Widen back above 860px: map and list show side by side, full detail cards inline (photo, links, badge, description) — no picker/toggle needed.
7. Click a map marker: the corresponding list card/row scrolls into view and is visually highlighted.

Fix any discrepancy from this list before proceeding.

- [ ] **Step 6: Remove the temporary fixture data**

```bash
rm public/data/_fixture.json
```
Leave `public/data/index.json` in place but reset it to an empty array — Task 17 populates it with the real Eilat entry:
```json
[]
```

- [ ] **Step 7: Build check**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Wire App.svelte, main.ts, and index.html; verify full app flow

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 15: `AGENTS.md`

**Files:**
- Create: `AGENTS.md`

**Interfaces:**
- Consumes: nothing (documentation only).
- Produces: the repo-root instructions file for future trip additions.

- [ ] **Step 1: Write `AGENTS.md`**

```markdown
# AGENTS.md — Keto Recon maintenance guide

This file tells an agent everything needed to add a new trip to this
app with no further instructions beyond the location itself.

**For a new trip, the user only needs to provide the location — do the
location setup, restaurant research/scoring, and data file creation
without needing further instructions.**

## 1. Adding a new trip location

1. Pick a short, URL-safe slug for the location, e.g. `tel-aviv`,
   `eilat`, `barcelona-2027`.
2. Find the hotel's exact coordinates (lat/lng) — e.g. via
   OpenStreetMap's search/Nominatim, or the hotel's own site.
3. Create `public/data/<slug>.json` matching this schema exactly:

   ```json
   {
     "location_name": "Human-readable trip/hotel label",
     "hotel": {
       "name": "Hotel name",
       "lat": 0.0,
       "lng": 0.0,
       "address": "Full address"
     },
     "restaurants": [
       {
         "id": "unique-slug",
         "name": "Restaurant Name",
         "website_url": "https://...",
         "menu_url_he": "https://... or null",
         "image_url": "https://... (externally hosted image)",
         "lat": 0.0,
         "lng": 0.0,
         "google_rating": 4.5,
         "keto_score": 7.2,
         "description": "Short paragraph: what the place is, and specifically how well it fits keto.",
         "distance_km": 1.3,
         "taxi_fare_day": 25,
         "taxi_fare_night": 32,
         "currency": "ILS"
       }
     ]
   }
   ```

4. Add an entry to `public/data/index.json` (an array of
   `{ "slug": ..., "location_name": ... }`), so the location picker
   (or auto-load, if it's the only trip) picks it up. Do not remove
   existing entries unless the user asks to retire a trip.
5. Run `npm run build` to confirm the JSON is valid and the site still
   builds.

## 2. Researching and adding restaurant data

- **Scope:** only include restaurants within the drive-time radius the
  user specifies for that trip (e.g. "15 minutes"). Use a mapping tool
  to estimate real drive times from the hotel, not straight-line
  distance — a place 2km away across a highway interchange can be
  outside a 15-minute radius while one 4km away on a direct road is
  inside it.
- **Required fields:** every field in the schema above is required
  except `menu_url_he`, which is `null` if no Hebrew (or otherwise
  local-language) menu page exists.
- **`description`:** one short paragraph (2–4 sentences) covering (a)
  what kind of restaurant it is and (b) specifically how well it fits
  keto — which dishes work, what to avoid, whether staff are used to
  low-carb requests, etc. Write this from the restaurant's actual menu
  where possible, not generic boilerplate.
- **`image_url`:** an externally hosted image (the restaurant's own
  site, Google Maps/Business photos, or another public source) — do
  not download or commit images into this repo; the app hotlinks them.
- **`menu_url_he`:** look for a Hebrew-language menu page on the
  restaurant's own site or a menu aggregator; if none exists, use
  `null` rather than omitting the field.
- **Taxi fares (`taxi_fare_day` / `taxi_fare_night`):** estimate using
  the destination country's standard taxi tariff structure (e.g.
  Israel's government-regulated Tariff 1 daytime / Tariff 2
  night-and-weekend rates) applied to the actual driving distance;
  round to a sensible whole number in the local currency. Set
  `currency` to the correct ISO-ish local code used elsewhere in that
  trip's file (e.g. `"ILS"`).
- **`google_rating`:** the restaurant's current Google Maps rating.

## 3. Keto score methodology (apply consistently across every trip)

The `keto_score` is authored once, offline, during data collection —
the app never computes it. Score on a **0–10 scale** using these rules:

1. The score reflects how well the restaurant's actual menu fits a
   keto (high-fat, low-carb) diet.
2. More dishes/options that are naturally high-fat and low-carb push
   the score higher.
3. A restaurant with zero keto-fitting options scores **0**.
4. A restaurant that also serves non-keto diners well (a varied menu:
   pasta, bread, dessert, etc., alongside solid keto options) scores
   **higher** than an otherwise-comparable restaurant that is
   exclusively keto/low-carb — variety matters because real trips
   involve non-keto dining companions.
5. A generic meat-based restaurant (a standard steakhouse or grill) is
   **not** a "keto-exclusive" niche place just because meat is
   naturally low-carb — score it as a normal high-fat/low-carb-friendly
   option (per rule 2), not as if it were a specialty keto restaurant.
6. Among restaurants with otherwise comparable keto-fit, a **higher
   Google rating nudges the score up** — rating is a tiebreaker/minor
   multiplier, never the primary factor.

There is no fixed formula converting these rules into a single number;
apply them as a rubric and use judgment, the same way a human reviewer
would, so that scores stay comparable in intent across trips even
though no two agents will compute bit-identical numbers.

## 4. Git workflow

The initial build of this app was committed directly to `main`. **For
all future changes** (new trips, data edits, code changes), work in a
feature branch and open a merge request — do not commit directly to
`main`.

## 5. Deployment

Pushing to `main` (via a merged MR) triggers `.gitlab-ci.yml`'s `pages`
job automatically, which builds and publishes the site to GitLab
Pages. No manual deploy step is needed.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "Add AGENTS.md maintenance guide

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 16: GitLab CI/CD Pages deployment

**Files:**
- Create: `.gitlab-ci.yml`

**Interfaces:**
- Consumes: `npm run build` (Task 1) producing `dist/`.
- Produces: automatic GitLab Pages deployment on push to `main`.

- [ ] **Step 1: Write `.gitlab-ci.yml`**

```yaml
image: node:20-alpine

stages:
  - build

pages:
  stage: build
  script:
    - npm ci
    - npm run build
    - mv dist public
  artifacts:
    paths:
      - public
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

- [ ] **Step 2: Validate YAML syntax locally**

Run: `python3 -c "import yaml, sys; yaml.safe_load(open('.gitlab-ci.yml'))" && echo "valid YAML"`
Expected: prints `valid YAML`. (If `python3`/`pyyaml` isn't available, visually re-check indentation instead — GitLab's own pipeline will validate it on first push regardless.)

- [ ] **Step 3: Commit**

```bash
git add .gitlab-ci.yml
git commit -m "Add GitLab Pages CI/CD pipeline

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 17: Dan Hotel Eilat dataset (real restaurant research)

**Files:**
- Modify: `public/data/index.json`
- Create: `public/data/eilat.json`

**Interfaces:**
- Consumes: the schema from Task 15's `AGENTS.md` / the design spec §3.
- Produces: the first real, usable dataset.

- [ ] **Step 1: Locate Dan Hotel Eilat's coordinates and address**

Use web search to find Dan Hotel Eilat's exact address and coordinates (confirm via a map search, e.g. searching "Dan Eilat hotel address coordinates").

- [ ] **Step 2: Research restaurants within a 15-minute drive**

Use web search to identify real, currently-operating restaurants within roughly a 15-minute drive of Dan Hotel Eilat (Eilat's hotel strip / North Beach / marina / town center area all typically qualify given the city's compact layout — verify each candidate isn't further out, e.g. not requiring highway travel toward the Egyptian or Jordanian border crossings). For each candidate restaurant, gather:
- Name, official website (or a reliable listing page if no official site exists)
- Coordinates (via map search)
- Current Google rating
- Whether a Hebrew-language menu page exists (URL or `null`)
- An externally-hosted image URL (restaurant's own site or Google Business photos)
- Enough information about the actual menu to write an accurate keto-fit description

- [ ] **Step 3: Score each restaurant per the methodology in `AGENTS.md` §3**

For each restaurant, write the 2–4 sentence `description` (what the place is + specifically how it fits keto) and assign `keto_score` (0–10) following the rubric: zero-fit → 0; more high-fat/low-carb options → higher; varied menus (also serving non-keto diners well) score higher than exclusively-keto menus at comparable fit; a generic steakhouse/grill is a normal low-carb-friendly option, not a keto-exclusive niche place; higher Google rating nudges score up as a tiebreaker only.

- [ ] **Step 4: Estimate day/night taxi fares**

For each restaurant's actual driving distance from Dan Hotel Eilat, estimate `taxi_fare_day` and `taxi_fare_night` in ILS using Israel's standard day/night taxi tariff conventions, and set `distance_km` to the real driving distance (not straight-line).

- [ ] **Step 5: Write `public/data/eilat.json`**

Populate the full file matching the schema, with `location_name: "Dan Hotel Eilat"`, the real hotel object, and the full `restaurants` array from Steps 2–4. Use a URL-safe `id` slug per restaurant (e.g. `"north-beach-grill"`).

- [ ] **Step 6: Register the trip in the manifest**

Update `public/data/index.json` to:
```json
[{ "slug": "eilat", "location_name": "Dan Hotel Eilat" }]
```

- [ ] **Step 7: Validate the JSON and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; `dist/` is produced.

- [ ] **Step 8: Commit**

```bash
git add public/data/eilat.json public/data/index.json
git commit -m "Add Dan Hotel Eilat restaurant dataset

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 18: Final integration verification

**Files:** none created; verification only.

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: ranking module tests pass (6/6 from Task 3).

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: exits 0, `dist/index.html` + `dist/assets/*` produced, no console errors printed during build.

- [ ] **Step 3: Manually verify the real Eilat data end-to-end**

Run: `npm run dev`, open the browser. Confirm: the Eilat trip loads automatically (single manifest entry, no picker); every restaurant card/row shows real data (no lingering fixture placeholders); the map is centered on Dan Hotel Eilat with all restaurant markers plausible on a real map of Eilat; the slider re-ranks the real restaurant set sensibly at both extremes; the mobile view (resize below 860px) shows compact rows, hamburger toggle, and working detail navigation for at least two real restaurants, including one with a `menu_url_he` and one with `null` (confirming the Menu button correctly appears/disappears).

- [ ] **Step 4: Preview the production build itself, not just the dev server**

Run: `npm run build && npx vite preview`, open the printed URL, spot-check the same flows as Step 3 against the built output (catches base-path/asset issues the dev server can hide).

- [ ] **Step 5: Final commit (only if Steps 1–4 required fixes)**

If everything already passed with no changes, skip this step. Otherwise:
```bash
git add -A
git commit -m "Fix issues found during final integration verification

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
