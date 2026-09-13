import { writable, type Readable } from 'svelte/store';

const QUERY = '(min-width: 860px)';

function createIsDesktopStore(): Readable<boolean> {
  const mql = typeof window !== 'undefined' ? window.matchMedia(QUERY) : null;
  const { subscribe, set } = writable(mql ? mql.matches : true);
  if (mql) {
    mql.addEventListener('change', (e) => set(e.matches));
  }
  return { subscribe };
}

export const isDesktop = createIsDesktopStore();
