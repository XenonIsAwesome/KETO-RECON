import { writable } from 'svelte/store';

export type Language = 'en' | 'he';

export interface Localized {
  en: string;
  he: string;
}

const STORAGE_KEY = 'keto-recon-language';

function readInitial(): Language {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return stored === 'he' ? 'he' : 'en';
  } catch {
    return 'en';
  }
}

export const language = writable<Language>(readInitial());

if (typeof window !== 'undefined') {
  language.subscribe((lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore (private browsing / storage blocked)
    }
  });
}

export function t(text: Localized, lang: Language): string {
  return text[lang];
}

// Static UI strings that aren't part of the trip data itself (restaurant
// names/descriptions come from the JSON), but still need to flip to
// Hebrew alongside it.
export const ui = {
  website: { en: 'Website', he: 'אתר' },
  // The data only ever gives us a menu link in one language at a time
  // (currently always Hebrew — see Restaurant.menu_url_he). When the
  // viewer isn't reading in that language, plain "Menu" is misleading —
  // call out which language it's actually in.
  menu: { en: 'Menu', he: 'תפריט' },
  hebrewMenu: { en: 'Hebrew Menu', he: 'תפריט' },
  backToRankings: { en: 'BACK TO RANKINGS', he: 'חזרה לדירוג' },
  restaurantNotFound: { en: 'Restaurant not found.', he: 'המסעדה לא נמצאה.' },
} satisfies Record<string, Localized>;

/** Label for a link to a menu that's only available in Hebrew. */
export function menuLabel(lang: Language): string {
  return t(lang === 'he' ? ui.menu : ui.hebrewMenu, lang);
}
