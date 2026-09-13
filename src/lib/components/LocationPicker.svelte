<script lang="ts">
  import type { ManifestEntry } from '../types';
  import { language, t } from '../language';

  let { manifest, onSelect }: { manifest: ManifestEntry[]; onSelect: (slug: string) => void } =
    $props();
</script>

<div class="picker">
  <h1 class="mono">KETO RECON</h1>
  <p class="subtitle mono">SELECT TARGET LOCATION</p>
  <ul>
    {#each manifest as entry (entry.slug)}
      <li>
        <button onclick={() => onSelect(entry.slug)} dir={$language === 'he' ? 'rtl' : 'ltr'}>
          {t(entry.location_name, $language)}
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
  }
  h1 {
    color: var(--accent);
    letter-spacing: 0.15em;
    font-size: 1.5rem;
    margin: 0;
  }
  .subtitle {
    color: var(--text-dim);
    letter-spacing: 0.1em;
    font-size: 0.85rem;
    margin: 0;
  }
  ul {
    list-style: none;
    padding: 0;
    width: 100%;
    max-width: 360px;
  }
  li {
    margin-bottom: 0.75rem;
  }
  button {
    width: 100%;
    padding: 0.9rem 1rem;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: var(--radius);
    font-size: 1rem;
  }
  button:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
