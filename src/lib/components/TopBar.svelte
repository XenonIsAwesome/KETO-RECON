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
