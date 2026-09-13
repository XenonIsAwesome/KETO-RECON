import type { Trip, ManifestEntry } from './types';

export async function loadManifest(): Promise<ManifestEntry[]> {
  const res = await fetch('data/index.json');
  if (!res.ok) {
    throw new Error(`Failed to load manifest: HTTP ${res.status}`);
  }
  return res.json();
}

export async function loadTrip(slug: string): Promise<Trip> {
  const res = await fetch(`data/${slug}.json`);
  if (!res.ok) {
    throw new Error(`Failed to load trip data for "${slug}": HTTP ${res.status}`);
  }
  return res.json();
}
