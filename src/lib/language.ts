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
  // A restaurant can have a menu link in Hebrew, English, both, or
  // neither (Restaurant.menu_url_he / menu_url_en). Plain "Menu" only
  // makes sense when there's one link and it's in the viewer's own
  // language; otherwise call out which language it's actually in so a
  // click doesn't land on a page the reader can't use.
  menu: { en: 'Menu', he: 'תפריט' },
  hebrewMenu: { en: 'Hebrew Menu', he: 'תפריט בעברית' },
  englishMenu: { en: 'English Menu', he: 'תפריט באנגלית' },
  backToRankings: { en: 'BACK TO RANKINGS', he: 'חזרה לדירוג' },
  restaurantNotFound: { en: 'Restaurant not found.', he: 'המסעדה לא נמצאה.' },
} satisfies Record<string, Localized>;

/**
 * Label for a link to a menu available in `menuLang`, as read by someone
 * in `currentLang`. When both a Hebrew and an English menu exist for the
 * same restaurant, `distinguish` should be true so each link is named
 * explicitly instead of both collapsing to a plain "Menu".
 */
export function menuLinkLabel(menuLang: Language, currentLang: Language, distinguish: boolean): string {
  if (!distinguish && menuLang === currentLang) return t(ui.menu, currentLang);
  return t(menuLang === 'he' ? ui.hebrewMenu : ui.englishMenu, currentLang);
}
