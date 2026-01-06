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
  t: (key: string, params?: Record<string, any>) => string;
  lang: Language; // Добавляем alias для удобства
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

  // Helper function that uses current language and supports parameters
  const t = (key: string, params?: Record<string, any>) => {
    let translated = translateFn(key, language);
    
    // Replace parameters like {count} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translated = translated.replace(`{${paramKey}}`, String(value));
      });
    }
    
    return translated;
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Save to localStorage for persistence across logout
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, lang: language }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback to default language if context is not available
    console.warn('useTranslation used outside I18nProvider, using default language');
    const fallbackT = (key: string, params?: Record<string, any>) => {
      let translated = translateFn(key, 'ru'); // Default to Russian
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          translated = translated.replace(`{${paramKey}}`, String(value));
        });
      }
      return translated;
    };
    return { 
      language: 'ru' as Language, 
      setLanguage: () => console.warn('setLanguage called outside I18nProvider'),
      t: fallbackT,
      lang: 'ru' as Language,
    };
  }
  return context;
}
