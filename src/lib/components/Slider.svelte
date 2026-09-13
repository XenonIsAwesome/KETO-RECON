<script lang="ts">
  import { sliderWeight } from '../stores';
</script>

<div class="slider-wrap">
  <span class="label mono">CLOSER</span>
  <input
    type="range"
    min="0"
    max="1"
    step="0.01"
    value={$sliderWeight}
    oninput={(e) => sliderWeight.set(Number((e.target as HTMLInputElement).value))}
  />
  <span class="label mono">KETO FIT</span>
</div>

<style>
  .slider-wrap {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    flex: 1;
    min-width: 160px;
  }
  @media (max-width: 860px) {
    .slider-wrap {
      flex-basis: 100%;
      min-width: 0;
      order: 3;
    }
  }
  input[type='range'] {
    flex: 1;
    accent-color: var(--accent);
  }
  .label {
    font-size: 0.7rem;
    color: var(--text-dim);
    letter-spacing: 0.05em;
    white-space: nowrap;
  }
</style>
