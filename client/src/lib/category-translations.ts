/**
 * Category Translation Utility
 * 
 * Переводит системные категории на язык пользователя
 * 
 * Junior-Friendly Guide:
 * =====================
 * Системные категории (Food, Transport, Shopping и т.д.) хранятся в БД на английском.
 * Но пользователь может видеть интерфейс на русском.
 * Эта функция переводит английские названия категорий на язык пользователя.
 */

import { t as translateFn } from '@shared/i18n';
import type { Language } from '@shared/i18n';
import { useTranslation } from '@/i18n/context';

// Системные категории, которые имеют переводы
// Порядок важен: более специфичные категории должны быть первыми
const SYSTEM_CATEGORIES = [
  'Food & Drinks', // Более специфичная категория
  'Unaccounted',
  'Salary',
  'Freelance',
  'Food',
  'Transport',
  'Entertainment',
  'Bills',
  'Shopping',
  'Healthcare',
  'Education',
  'Housing',
  'Travel',
  'Other',
];

/**
 * Перевести название категории на язык пользователя
 * 
 * @param category - Название категории (может быть на английском или уже переведенное)
 * @param lang - Язык пользователя ('en' | 'ru')
 * @returns Переведенное название категории или оригинальное, если перевод не найден
 */
export function translateCategory(category: string, lang: Language = 'en'): string {
  // Проверяем, является ли это системной категорией
  if (SYSTEM_CATEGORIES.includes(category)) {
    // Пробуем найти перевод через i18n
    const translationKey = `categories.name.${category}`;
    const translated = translateFn(translationKey, lang);
    
    // Если перевод найден (не равен ключу), возвращаем его
    if (translated !== translationKey) {
      return translated;
    }
  }
  
  // Если это не системная категория или перевод не найден, возвращаем оригинальное название
  return category;
}

/**
 * React hook для перевода категорий с использованием языка из контекста
 * 
 * @returns Функция для перевода категорий
 */
export function useTranslateCategory() {
  const { language } = useTranslation();
  
  return (category: string) => translateCategory(category, language);
}
