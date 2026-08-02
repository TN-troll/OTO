import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { translations, type Locale, type Translations } from './translations';

interface LanguageContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'nl',
  t: translations.nl,
  setLocale: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('car-ads-locale');
    return (saved === 'en' || saved === 'nl') ? saved : 'nl';
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('car-ads-locale', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = translations[locale];

  return (
    <LanguageContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
