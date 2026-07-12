import React from 'react';
import i18n from './i18next';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLanguageReady: boolean;
  hasLanguagePreference: boolean;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

// Normalization helper
export function normalizeLanguage(lang: any): Language | null {
  if (typeof lang !== 'string') return null;
  const cleaned = lang.trim().toLowerCase();
  if (cleaned === 'en' || cleaned.startsWith('en-') || cleaned.startsWith('en_')) {
    return 'en';
  }
  if (cleaned === 'hi' || cleaned.startsWith('hi-') || cleaned.startsWith('hi_')) {
    return 'hi';
  }
  return null;
}

// Cookie helpers
export function getCookie(name: string): string | null {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const popped = parts.pop();
      if (popped) return popped.split(';').shift() || null;
    }
  } catch (e) {
    console.error('Error reading cookie:', e);
  }
  return null;
}

export function setCookie(name: string, value: string, maxAge: number = 31536000) {
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
  } catch (e) {
    console.error('Error setting cookie:', e);
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = React.useState<Language>('en');
  const [isLanguageReady, setIsLanguageReady] = React.useState(false);
  const [hasLanguagePreference, setHasLanguagePreference] = React.useState(false);

  // Initialize language preference
  React.useEffect(() => {
    const initLanguage = () => {
      // 1. Resolve from cookie
      const cookieVal = getCookie('mantrapuja_language');
      const normalizedCookie = normalizeLanguage(cookieVal);

      if (normalizedCookie) {
        setLanguageState(normalizedCookie);
        setHasLanguagePreference(true);
        // Sync local storage just in case
        try {
          localStorage.setItem('mantrapuja_language', normalizedCookie);
        } catch (e) {}
        setIsLanguageReady(true);
        return;
      }

      // 2. Resolve from local storage
      let localVal: string | null = null;
      try {
        localVal = localStorage.getItem('mantrapuja_language');
      } catch (e) {}
      const normalizedLocal = normalizeLanguage(localVal);

      if (normalizedLocal) {
        setLanguageState(normalizedLocal);
        setHasLanguagePreference(true);
        // Sync cookie
        setCookie('mantrapuja_language', normalizedLocal);
        setIsLanguageReady(true);
        return;
      }

      // 3. No valid preference found
      setHasLanguagePreference(false);
      setIsLanguageReady(true);
    };

    initLanguage();
  }, []);

  // Update language preference
  const setLanguage = (lang: Language) => {
    const normalized = normalizeLanguage(lang);
    if (!normalized) return;

    setLanguageState(normalized);
    setHasLanguagePreference(true);

    // Save persistence
    setCookie('mantrapuja_language', normalized);
    try {
      localStorage.setItem('mantrapuja_language', normalized);
    } catch (e) {}
  };

  // Sync state across multiple tabs
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mantrapuja_language' && e.newValue) {
        const normalized = normalizeLanguage(e.newValue);
        if (normalized && normalized !== language) {
          setLanguageState(normalized);
          setHasLanguagePreference(true);
          // Sync cookie
          setCookie('mantrapuja_language', normalized);
        }
      }
    };

    try {
      window.addEventListener('storage', handleStorageChange);
    } catch (e) {}

    return () => {
      try {
        window.removeEventListener('storage', handleStorageChange);
      } catch (e) {}
    };
  }, [language]);

  // Sync downstream static UI language preference
  React.useEffect(() => {
    void i18n.changeLanguage(language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLanguageReady, hasLanguagePreference }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
