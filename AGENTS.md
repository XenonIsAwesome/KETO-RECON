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
3. Create `public/data/<slug>.json` matching this schema exactly. Every
   `Localized` field (`location_name`, `hotel.name`, a restaurant's
   `name` and `description`) is an object with both an `en` and a `he`
   value — see section 2 below for how to collect the Hebrew side:

   ```json
   {
     "location_name": { "en": "Human-readable trip/hotel label", "he": "התוית בעברית" },
     "hotel": {
       "name": { "en": "Hotel name", "he": "שם המלון בעברית" },
       "lat": 0.0,
       "lng": 0.0,
       "address": "Full address (single language is fine — not shown in the UI)"
     },
     "restaurants": [
       {
         "id": "unique-slug",
         "name": { "en": "Restaurant Name", "he": "שם המסעדה בעברית" },
         "website_url": "https://...",
         "menu_url_he": "https://... or null",
         "image_url": "https://... (externally hosted image)",
         "lat": 0.0,
         "lng": 0.0,
         "google_rating": 4.5,
         "keto_score": 7.2,
         "description": {
           "en": "Short paragraph: what the place is, and specifically how well it fits keto.",
           "he": "אותו תיאור בעברית — לא תרגום מילולי, אלא ניסוח טבעי."
         },
         "distance_km": 1.3,
         "taxi_fare_day": 25,
         "taxi_fare_night": 32,
         "currency": "ILS"
       }
     ]
   }
   ```

4. Add an entry to `public/data/index.json` (an array of
   `{ "slug": ..., "location_name": { "en": ..., "he": ... } }`), so
   the location picker (or auto-load, if it's the only trip) picks it
   up. Do not remove existing entries unless the user asks to retire a
   trip.
5. Run `npm run build` to confirm the JSON is valid and the site still
   builds.
6. `currency` stays an ISO-ish code (`"ILS"`, `"USD"`, ...) — the app
   renders the matching symbol (₪, $, ...) itself via
   `src/lib/currency.ts`. If a trip uses a currency not in that file's
   `SYMBOLS` map, add it there too.

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
- **Bilingual `name` and `description`:** collect both an English and
  a Hebrew version of the restaurant's name (many are the same brand
  name either way, e.g. "Pastory"/"פסטורי" — check the restaurant's
  own site/socials for how they render their own name in Hebrew, don't
  just transliterate blind) and a genuinely separate Hebrew
  `description` (write it naturally in Hebrew — not a machine
  translation of the English one, though it should cover the same
  ground: what the place is, and specifically how it fits keto).
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
- **Verify every link before it goes in the dataset.** Fetch
  `website_url` and `menu_url_he` (when not `null`) and confirm each
  one actually loads the restaurant's real page — not a 404, a parked
  domain, or a redirect to something unrelated. A link that looked
  right in a search result can still be dead or renamed; if it 404s,
  search for the restaurant's current official site (or its listing on
  an aggregator like the hotel chain's own site) instead of leaving a
  broken link in the data.
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
