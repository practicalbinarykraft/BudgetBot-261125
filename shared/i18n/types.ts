/**
 * i18n Types - Type definitions for internationalization
 * Supports English (en) and Russian (ru)
 */

export type Language = 'en' | 'ru';

export interface Translation {
  en: string;
  ru: string;
}

export interface Translations {
  [key: string]: Translation;
}
