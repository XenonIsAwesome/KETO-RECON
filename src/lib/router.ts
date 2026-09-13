import { writable } from 'svelte/store';

export type Route = { name: 'trip' } | { name: 'restaurant'; id: string };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);
  if (parts[0] === 'r' && parts[1]) {
    return { name: 'restaurant', id: decodeURIComponent(parts[1]) };
  }
  return { name: 'trip' };
}

function currentRoute(): Route {
  return parseHash(typeof location !== 'undefined' ? location.hash : '');
}

export const route = writable<Route>(currentRoute());

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route.set(currentRoute());
  });
}

export function navigateToTrip(): void {
  location.hash = '#/';
}

export function navigateToRestaurant(id: string): void {
  location.hash = `#/r/${encodeURIComponent(id)}`;
}
