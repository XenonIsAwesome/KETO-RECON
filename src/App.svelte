<script lang="ts">
  import { onMount } from 'svelte';
  import { loadManifest, loadTrip } from './lib/dataLoader';
  import { trip as tripStore } from './lib/stores';
  import { route } from './lib/router';
  import { language } from './lib/language';
  import type { ManifestEntry } from './lib/types';
  import LocationPicker from './lib/components/LocationPicker.svelte';
  import TripView from './lib/components/TripView.svelte';
  import RestaurantDetail from './lib/components/RestaurantDetail.svelte';

  let manifest = $state<ManifestEntry[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let currentSlug = $state<string | null>(null);

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
      currentSlug = slug;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }
</script>

<div id="app" class="scanlines" dir={$language === 'he' ? 'rtl' : 'ltr'}>
  {#if loading}
    <div class="status-screen mono">LOADING RECON DATA…</div>
  {:else if error}
    <div class="status-screen mono">ERROR: {error}</div>
  {:else if !$tripStore}
    <LocationPicker {manifest} onSelect={selectTrip} />
  {:else if $route.name === 'restaurant'}
    <RestaurantDetail id={$route.id} />
  {:else if currentSlug}
    <TripView {manifest} {currentSlug} onChangeTrip={selectTrip} />
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
