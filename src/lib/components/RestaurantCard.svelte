<script lang="ts">
  import type { RankedRestaurant } from '../ranking';
  import { selectedId } from '../stores';
  import { language, t, ui, menuLabel } from '../language';
  import { currencySymbol } from '../currency';
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
  <img class="photo" src={restaurant.image_url} alt={t(restaurant.name, $language)} loading="lazy" />
  <div class="body">
    <div class="header-row">
      <span class="position mono">#{restaurant.position}</span>
      <a
        class="name"
        href={restaurant.website_url}
        target="_blank"
        rel="noopener noreferrer"
        dir={$language === 'he' ? 'rtl' : 'ltr'}
      >
        {t(restaurant.name, $language)}
      </a>
      <KetoBadge score={restaurant.keto_score} />
    </div>
    <div class="meta mono">
      <span class="rating"><Star size={14} /> {restaurant.google_rating.toFixed(1)}</span>
      <span class="distance"><MapPin size={14} /> {restaurant.distance_km.toFixed(1)} km</span>
      <span class="fare">
        <Car size={14} /> day {currencySymbol(restaurant.currency)}{restaurant.taxi_fare_day} /
        night {currencySymbol(restaurant.currency)}{restaurant.taxi_fare_night}
      </span>
    </div>
    <p class="description" dir={$language === 'he' ? 'rtl' : 'ltr'}>
      {t(restaurant.description, $language)}
    </p>
    <div class="actions">
      <a class="link" href={restaurant.website_url} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={14} /> {t(ui.website, $language)}
      </a>
      {#if restaurant.menu_url_he}
        <a class="link" href={restaurant.menu_url_he} target="_blank" rel="noopener noreferrer">
          <BookOpen size={14} /> {menuLabel($language)}
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
    /* dir=rtl (set inline for correct Hebrew bidi ordering) would
       otherwise also flip this element's own text-align; pin it so
       only the words change, not its position in the row. */
    text-align: left;
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
    text-align: left;
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
