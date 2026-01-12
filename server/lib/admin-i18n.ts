/**
 * Admin i18n Helper
 * 
 * Junior-Friendly Guide:
 * =====================
 * Утилита для получения переведенных сообщений в админ-роутах.
 * Использует язык из заголовка Accept-Language или настройки админа.
 * 
 * Использование:
 *   import { getAdminT } from '../lib/admin-i18n';
 *   const t = getAdminT(req);
 *   res.status(400).json({ error: t('admin.errors.invalid_query_parameters') });
 */

import type { Request } from 'express';
import { t, type Language } from '@shared/i18n';

/**
 * Получает язык из запроса
 * Приоритет:
 * 1. Accept-Language заголовок
 * 2. Язык из сессии админа (если есть)
 * 3. По умолчанию 'en'
 */
function getLanguageFromRequest(req: Request): Language {
  // Проверяем Accept-Language заголовок
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    if (acceptLanguage.toLowerCase().includes('ru')) {
      return 'ru';
    }
    if (acceptLanguage.toLowerCase().includes('en')) {
      return 'en';
    }
  }

  // TODO: Можно добавить проверку языка из сессии админа
  // const adminSession = (req as any).session?.admin;
  // if (adminSession?.language) {
  //   return adminSession.language === 'ru' ? 'ru' : 'en';
  // }

  return 'en';
}

/**
 * Создает функцию перевода для админ-роута
 * 
 * @param req - Express Request
 * @returns Функция t(key: string) для перевода
 */
export function getAdminT(req: Request): (key: string) => string {
  const lang = getLanguageFromRequest(req);
  return (key: string) => t(key, lang);
}
