/**
 * i18n React Context - Language state management for web client
 * Syncs with user settings in database
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

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');

  // Fetch user settings to get language preference
  const { data: settings } = useQuery<any>({
    queryKey: ['/api/settings'],
  });

  // Sync language with settings when loaded
  useEffect(() => {
    if (settings?.language) {
      const lang = settings.language === 'ru' ? 'ru' : 'en';
      setLanguageState(lang);
    }
  }, [settings]);

  // Helper function that uses current language
  const t = (key: string) => translateFn(key, language);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Language will be saved when user updates settings
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
