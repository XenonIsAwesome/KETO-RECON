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
