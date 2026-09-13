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
