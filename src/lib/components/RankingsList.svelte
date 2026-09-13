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
