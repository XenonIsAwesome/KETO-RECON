<script lang="ts">
  import { trip } from '../stores';
  import { isDesktop } from '../breakpoint';
  import type { ManifestEntry } from '../types';
  import TopBar from './TopBar.svelte';
  import MapView from './MapView.svelte';
  import RankingsList from './RankingsList.svelte';

  let {
    manifest,
    currentSlug,
    onChangeTrip,
  }: { manifest: ManifestEntry[]; currentSlug: string; onChangeTrip: (slug: string) => void } =
    $props();

  let mobilePanel = $state<'map' | 'list'>('list');
</script>

{#if $trip}
  <div class="trip-view">
    <TopBar
      trip={$trip}
      {manifest}
      {currentSlug}
      {onChangeTrip}
      activePanel={mobilePanel}
      onSelectPanel={(p) => (mobilePanel = p)}
    />
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
