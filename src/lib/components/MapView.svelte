<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { trip, rankedRestaurants, selectedId } from '../stores';
  import { isDesktop } from '../breakpoint';
  import { navigateToRestaurant } from '../router';
  import { language } from '../language';
  import { mountMapProvider, type MapProviderHandle } from '../mapProviders';

  let container: HTMLDivElement;
  let handle: MapProviderHandle | null = null;
  let unsubscribers: Array<() => void> = [];

  function onMarkerClick(id: string) {
    selectedId.set(id);
    // On mobile there's no list panel visible alongside the map, so jump
    // straight to the restaurant's detail page; on desktop the list card
    // is already on screen, so just highlight/pan to it.
    if (!get(isDesktop)) navigateToRestaurant(id);
  }

  onMount(async () => {
    const { handle: mounted } = await mountMapProvider({ container, onMarkerClick });
    handle = mounted;

    handle.renderHotel(get(trip), get(language));
    handle.renderRestaurants(get(rankedRestaurants), get(language));
    handle.setSelected(get(selectedId));

    const unsubTrip = trip.subscribe(($trip) => handle?.renderHotel($trip, get(language)));
    const unsubRanked = rankedRestaurants.subscribe(($ranked) =>
      handle?.renderRestaurants($ranked, get(language)),
    );
    const unsubLanguage = language.subscribe((lang) => {
      handle?.renderHotel(get(trip), lang);
      handle?.renderRestaurants(get(rankedRestaurants), lang);
    });
    const unsubSelected = selectedId.subscribe(($id) => handle?.setSelected($id));

    unsubscribers = [unsubTrip, unsubRanked, unsubLanguage, unsubSelected];
  });

  onDestroy(() => {
    unsubscribers.forEach((u) => u());
    handle?.destroy();
  });
</script>

<div class="map" bind:this={container}></div>

<style>
  .map {
    width: 100%;
    height: 100%;
    min-height: 260px;
  }
  :global(.restaurant-marker),
  :global(.hotel-marker) {
    background: transparent;
    border: none;
    filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.6));
  }
</style>
