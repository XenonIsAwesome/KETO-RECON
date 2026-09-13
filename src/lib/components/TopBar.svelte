<script lang="ts">
  import type { Trip, ManifestEntry } from '../types';
  import { language, t } from '../language';
  import Slider from './Slider.svelte';
  import { Menu, Map as MapIcon, List as ListIcon, Binoculars } from 'lucide-svelte';

  let {
    trip,
    manifest,
    currentSlug,
    onChangeTrip,
    activePanel,
    onSelectPanel,
  }: {
    trip: Trip;
    manifest: ManifestEntry[];
    currentSlug: string;
    onChangeTrip: (slug: string) => void;
    activePanel: 'map' | 'list';
    onSelectPanel: (panel: 'map' | 'list') => void;
  } = $props();

  let menuOpen = $state(false);

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function selectPanel(panel: 'map' | 'list') {
    onSelectPanel(panel);
    menuOpen = false;
  }
</script>

<header class="topbar">
  <div class="row-main">
    <div class="identity">
      <h1 class="mono"><Binoculars size={18} class="logo-icon" /> KETO RECON</h1>
      <p class="hotel" dir={$language === 'he' ? 'rtl' : 'ltr'}>
        {t(trip.hotel.name, $language)} — {t(trip.location_name, $language)}
      </p>
    </div>
    {#if manifest.length > 1}
      <select
        class="mono"
        value={currentSlug}
        onchange={(e) => onChangeTrip((e.target as HTMLSelectElement).value)}
      >
        {#each manifest as m (m.slug)}
          <option value={m.slug}>{t(m.location_name, $language)}</option>
        {/each}
      </select>
    {/if}
    <div class="lang-switch">
      <button
        class:active={$language === 'en'}
        onclick={() => language.set('en')}
        aria-label="English"
        title="English"
      >
        🇺🇸
      </button>
      <button
        class:active={$language === 'he'}
        onclick={() => language.set('he')}
        aria-label="עברית"
        title="עברית"
      >
        🇮🇱
      </button>
    </div>
    <div class="hamburger-wrap">
      <button
        class="hamburger"
        onclick={toggleMenu}
        aria-label="Open panel menu"
        aria-expanded={menuOpen}
      >
        <Menu size={20} />
      </button>
      {#if menuOpen}
        <div class="dropdown">
          <button class:active={activePanel === 'map'} onclick={() => selectPanel('map')}>
            <MapIcon size={14} /> Map
          </button>
          <button class:active={activePanel === 'list'} onclick={() => selectPanel('list')}>
            <ListIcon size={14} /> List
          </button>
        </div>
      {/if}
    </div>
  </div>
  <div class="row-slider">
    <Slider />
  </div>
</header>

<style>
  .topbar {
    display: flex;
    flex-direction: column;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
  }
  .row-main {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    flex-wrap: wrap;
  }
  .identity {
    order: 1;
    flex: 1 1 auto;
    min-width: 0;
  }
  .identity h1 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1rem;
    color: var(--accent);
    letter-spacing: 0.1em;
  }
  .identity h1 :global(.logo-icon) {
    flex-shrink: 0;
  }
  .hotel {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    /* dir=rtl (set inline for correct Hebrew bidi ordering) would
       otherwise also flip this block's own text-align; pin it so only
       the words change, not the line's position. */
    text-align: left;
  }
  select {
    order: 2;
    background: var(--bg-elevated);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.25rem 0.5rem;
  }
  .lang-switch {
    order: 2;
    display: flex;
    gap: 0.25rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.2rem;
  }
  .lang-switch button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.8rem;
    height: 1.6rem;
    background: none;
    border: 1px solid transparent;
    border-radius: calc(var(--radius) - 2px);
    font-size: 1rem;
    line-height: 1;
    opacity: 0.45;
    filter: grayscale(60%);
  }
  .lang-switch button.active {
    opacity: 1;
    filter: none;
    border-color: var(--accent);
    background: var(--bg-panel);
  }
  .hamburger-wrap {
    order: 2;
    position: relative;
    display: none;
  }
  .hamburger {
    background: none;
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: var(--radius);
    padding: 0.4rem 0.7rem;
  }
  .dropdown {
    position: absolute;
    top: calc(100% + 0.25rem);
    right: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    min-width: 130px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .dropdown button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.8rem;
    background: none;
    border: none;
    color: var(--text);
    font-size: 0.85rem;
    text-align: left;
  }
  .dropdown button:hover {
    background: var(--bg-panel);
  }
  .dropdown button.active {
    color: var(--accent);
  }
  .row-slider {
    order: 3;
  }
  @media (max-width: 860px) {
    .hamburger-wrap {
      display: block;
    }
  }
</style>
