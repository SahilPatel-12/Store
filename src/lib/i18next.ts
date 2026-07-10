import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Statically import Phase 1 namespaces to avoid rendering flashes on start
import enCommon from '../locales/en/common.json';
import enNavbar from '../locales/en/navbar.json';
import enFooter from '../locales/en/footer.json';
import enLanguageSelector from '../locales/en/languageSelector.json';
import enCartDrawer from '../locales/en/cartDrawer.json';

import hiCommon from '../locales/hi/common.json';
import hiNavbar from '../locales/hi/navbar.json';
import hiFooter from '../locales/hi/footer.json';
import hiLanguageSelector from '../locales/hi/languageSelector.json';
import hiCartDrawer from '../locales/hi/cartDrawer.json';

const resources = {
  en: {
    common: enCommon,
    navbar: enNavbar,
    footer: enFooter,
    languageSelector: enLanguageSelector,
    cartDrawer: enCartDrawer,
  },
  hi: {
    common: hiCommon,
    navbar: hiNavbar,
    footer: hiFooter,
    languageSelector: hiLanguageSelector,
    cartDrawer: hiCartDrawer,
  }
};

// Dynamic lazy-loaded resource cache
const loadedBundles: Record<string, Record<string, boolean>> = {
  en: { common: true, navbar: true, footer: true, languageSelector: true, cartDrawer: true },
  hi: { common: true, navbar: true, footer: true, languageSelector: true, cartDrawer: true }
};

// Map of dynamic lazy-loaded namespaces for future phases
const loadNamespace = async (lng: string, ns: string): Promise<void> => {
  if (loadedBundles[lng]?.[ns]) return;
  try {
    const module = await import(`../locales/${lng}/${ns}.json`);
    i18n.addResourceBundle(lng, ns, module.default || module, true, true);
    if (!loadedBundles[lng]) loadedBundles[lng] = {};
    loadedBundles[lng][ns] = true;
  } catch (e) {
    console.warn(`Failed to load namespace ${ns} for language ${lng}`, e);
  }
};

// Export load helper for use in components/pages
export const loadNamespaces = async (lng: string, namespaces: string[]): Promise<void> => {
  await Promise.all(namespaces.map(ns => loadNamespace(lng, ns)));
};

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language, sync'd by LanguageProvider on start
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'navbar', 'footer', 'languageSelector', 'cartDrawer'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Turn off suspense to prevent route loading glitches
    }
  });

export default i18n;
