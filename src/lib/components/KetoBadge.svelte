<script lang="ts">
  import { Flame } from 'lucide-svelte';

  let { score }: { score: number } = $props();

  let clamped = $derived(Math.max(0, Math.min(10, score)));
  let pct = $derived(clamped / 10);
  const circumference = 2 * Math.PI * 16;
  let dash = $derived(circumference * pct);
</script>

<div class="badge mono" title="Keto fit score: {clamped.toFixed(1)} / 10">
  <svg viewBox="0 0 40 40" width="40" height="40">
    <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border)" stroke-width="4" />
    <circle
      cx="20"
      cy="20"
      r="16"
      fill="none"
      stroke="var(--accent)"
      stroke-width="4"
      stroke-dasharray="{dash} {circumference}"
      stroke-linecap="round"
      transform="rotate(-90 20 20)"
    />
  </svg>
  <div class="value-wrap">
    <Flame size={11} />
    <span class="value">{clamped.toFixed(1)}</span>
  </div>
</div>

<style>
  .badge {
    position: relative;
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .badge svg {
    position: absolute;
    inset: 0;
  }
  .value-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    color: var(--accent);
  }
  .value {
    font-size: 0.6rem;
    line-height: 1;
  }
</style>
