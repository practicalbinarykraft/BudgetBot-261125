/**
 * i18n React Context - Language state management for web client
 * Syncs with user settings in database and localStorage for unauthenticated users
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Language, t as translateFn } from '@shared/i18n';
import { useQuery } from '@tanstack/react-query';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

const LANGUAGE_STORAGE_KEY = 'budget-buddy-language';

// Get language from localStorage or browser
function getInitialLanguage(): Language {
  // Try localStorage first
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'ru' || stored === 'en') {
    return stored;
  }
  
  // Fallback to browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ru')) {
    return 'ru';
  }
  
  return 'en';
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage());

  // Fetch user settings to get language preference
  const { data: settings } = useQuery<any>({
    queryKey: ['/api/settings'],
  });

  // Sync language with settings when loaded (authenticated users)
  useEffect(() => {
    if (settings?.language) {
      const lang = settings.language === 'ru' ? 'ru' : 'en';
      setLanguageState(lang);
      // Also update localStorage to persist across logout
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  }, [settings]);

  // Helper function that uses current language
  const t = (key: string) => translateFn(key, language);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Save to localStorage for persistence across logout
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
